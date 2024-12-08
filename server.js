require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000; 

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const cors = require('cors');
app.use(cors({
    origin:['//https://jroglic.github.io/Projekat/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));




// Proveri povezivanje
conn.connect((err) => {
    if (err) {
        console.error('Greška prilikom povezivanja na bazu:', err);
    } else {
        console.log('Uspešno povezivanje na bazu podataka.');
    }
});

// Ruta za autentifikaciju korisnika
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE user_email = ? AND user_password = ?';
    conn.execute(query, [email, password], (err, results) => {
        if (err) {
            console.error('Greška prilikom izvršavanja upita:', err);
            res.status(500).send('Greška na serveru');
        } else if (results.length > 0) {
            res.status(200).send({ message: 'Uspešna prijava', user: results[0] });
        } else {
            res.status(401).send('Pogrešno korisničko ime ili lozinka');
        }
    });
});

// Pokretanje servera
app.listen(port, () => {
    console.log(`Server je pokrenut na http://localhost:${port}`);
});





//API za vracanje svih recepata iz baze
app.get('/recepti', (req, res) => {
    const query = `SELECT r.*, s.sas_naziv, rs.rsa_kolicina, m.mer_naziv
    FROM recepti r
    LEFT JOIN receptisastojci rs ON r.rec_id = rs.rec_id
    LEFT JOIN sastojci s ON rs.sas_id = s.sas_id
    LEFT JOIN mernejedinice m ON rs.mer_id = m.mer_id`;

    conn.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja recepata:', err);
            return res.status(500).send('Greška prilikom dobavljanja recepata');
        }

        // Grupisanje podataka
        const receptiMap = {};
        results.forEach(row => {
            if (!receptiMap[row.rec_id]) {
                receptiMap[row.rec_id] = {
                    rec_id: row.rec_id,
                    rec_naziv: row.rec_naziv,
                    rec_priprema: row.rec_priprema,
                    rec_vremepripreme: row.rec_vremepripreme,
                    rec_brojljudi: row.rec_brojljudi,
                    sastojci: []
                };
            }
            receptiMap[row.rec_id].sastojci.push({
                sas_naziv: row.sas_naziv,
                rsa_kolicina: row.rsa_kolicina,
                mer_naziv: row.mer_naziv
            });
        });

        const recepti = Object.values(receptiMap);
        res.json(recepti);
    });
});


// API za dodavanje recepata
app.post('/recepti', async (req, res) => {
    const { rec_naziv, rec_priprema, rec_vremepripreme, rec_brojljudi, sastojci, user_id } = req.body;

    try {
        const userQuery = 'SELECT user_level FROM users WHERE user_id = ?';
        const [userResults] = await conn.promise().execute(userQuery, [user_id]);

        if (userResults.length > 0 && userResults[0].user_level === 2) {
            const query = `INSERT INTO recepti (rec_naziv, rec_priprema, rec_vremepripreme, rec_brojljudi, user_id) 
                           VALUES (?, ?, ?, ?, ?)`;
            const [result] = await conn.promise().execute(query, [rec_naziv, rec_priprema, rec_vremepripreme, rec_brojljudi, user_id]);
            const rec_id = result.insertId;

            // Iteriraj kroz sve sastojke i proveri da li svaki postoji u bazi, ako ne, dodaj ga
            for (const sastojak of sastojci) {
                let sastojakId;
                
                // Provera da li sastojak već postoji
                const sastojakQuery = 'SELECT sas_id FROM sastojci WHERE sas_naziv = ?';
                const [sastojakResults] = await conn.promise().execute(sastojakQuery, [sastojak.naziv]);

                if (sastojakResults.length > 0) {
                    // Sastojak postoji
                    sastojakId = sastojakResults[0].sas_id;
                } else {
                    // Sastojak ne postoji, dodajemo ga
                    const noviSastojakQuery = 'INSERT INTO sastojci (sas_naziv) VALUES (?)';
                    const [noviSastojakResult] = await conn.promise().execute(noviSastojakQuery, [sastojak.naziv]);
                    sastojakId = noviSastojakResult.insertId;
                }

                // Dodavanje u tabelu receptisastojci
                const sastojakInsertQuery = 'INSERT INTO receptisastojci (rec_id, sas_id, mer_id, rsa_kolicina) VALUES (?, ?, ?, ?)';
                await conn.promise().execute(sastojakInsertQuery, [rec_id, sastojakId, sastojak.mer_id, sastojak.rsa_kolicina]);
            }

            res.status(201).send('Recept i sastojci uspesno dodati');
        } else {
            res.status(403).send('Nemate ovlašćenja za dodavanje recepata');
        }
    } catch (error) {
        console.error('Greška prilikom unosa recepta:', error);
        res.status(500).send('Greška na serveru prilikom unosa recepta');
    }
});

app.get('/recepti/:id', (req, res) => {

    const rec_id = req.params.id;

    const query = `SELECT r.rec_naziv, r.rec_priprema, r.rec_vremepripreme, r.rec_brojljudi,rs.rsa_kolicina, s.sas_naziv, m.mer_naziv FROM recepti r
    JOIN receptisastojci rs ON r.rec_id = rs.rec_id JOIN sastojci s ON rs.sas_id = s.sas_id JOIN mernejedinice m ON rs.mer_id = m.mer_id WHERE r.rec_id = ?`;

    conn.query(query, [rec_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja recepta:', err);
            return res.status(500).send('Greška na serveru');
        }
        res.json(results);
    });
});


// API za dodavanje recepta BEZ SLIKE
app.post('/dodajRecept', (req, res) => {
    const { naziv, priprema, brojLjudi, vremePripreme } = req.body;
  
    const query = 'INSERT INTO recepti (rec_naziv, rec_priprema, rec_brojljudi, rec_vremepripreme) VALUES (?, ?, ?, ?)';
    conn.query(query, [naziv, priprema, brojLjudi, vremePripreme], (err, results) => {

        if (err) {

            console.error('Greška prilikom dodavanja recepta:', err);

            return res.status(500).send('Greška prilikom dodavanja recepta');
        }

        res.status(200).send('Recept uspešno dodat');
    });
});


// API za prikazivanje recepata određenog korisnika
app.get('/recepti/user/:userId', (req, res) => {

    const userId = req.params.userId;

    const query = `SELECT r.rec_id, r.rec_naziv,r.rec_priprema,r.rec_vremepripreme,r.rec_brojljudi,rs.rsa_kolicina,s.sas_naziv,m.mer_naziv
    FROM recepti r 
    LEFT JOIN receptisastojci rs ON r.rec_id=rs.rec_id
    LEFT JOIN sastojci s ON rs.sas_id=s.sas_id
    LEFT JOIN mernejedinice m ON rs.mer_id=m.mer_id
    WHERE r.user_id=?`;

    conn.query(query, [userId], (err, results) => {

        if (err) {
            console.error('Greška prilikom dobavljanja recepata:', err);
            return res.status(500).send('Greška prilikom dobavljanja recepata');
        }

        const recepti={};
        results.forEach(row=>{
            if(!recepti[row.rec_id]){
                recepti[row.rec_id]={
                    rec_id:row.rec_id,
                    rec_naziv:row.rec_naziv,
                    rec_priprema:row.rec_priprema,
                    rec_vremepripreme:row.rec_vremepripreme,
                    rec_brojljudi:row.rec_brojljudi,
                    sastojci:[]
                };
            }
            if(row.sas_naziv){
                recepti[row.rec_id].sastojci.push({
                    sas_naziv:row.sas_naziv,
                    mer_naziv:row.mer_naziv,
                    rsa_kolicina:row.rsa_kolicina
                });
            }
        });
        res.json(Object.values(recepti));

    });
});

// API za prikazivanje svih recepata
app.get('/sviRecepti', (req, res) => {
    const query = 'SELECT * FROM recepti';
    conn.query(query, (err, results) => {
      if (err) {
        console.error('Greška prilikom dobavljanja recepata:', err);
        return res.status(500).send('Greška prilikom dobavljanja recepata');
      }
      res.json(results);
    });
});

// API za editovanje recepta
app.put('/recepti/:id', (req, res) => {
    const { rec_naziv = '', rec_priprema = '', rec_vremepripreme = 0, rec_brojljudi = 1 } = req.body;
    const rec_id = req.params.id;

    const query = `UPDATE recepti SET rec_naziv = ?, rec_priprema = ?, rec_vremepripreme = ?, rec_brojljudi = ? WHERE rec_id = ?`;
    
    conn.execute(query, [rec_naziv, rec_priprema, rec_vremepripreme, rec_brojljudi, rec_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom izmene recepta:', err);
            return res.status(500).send('Greška na serveru prilikom izmene recepta');
        }

        res.status(200).send('Recept uspešno izmenjen');
    });
});


// API za brisanje recepta
app.delete('/recepti/:id', (req, res) => {
    const rec_id = req.params.id;
    const user_id = req.body.user_id; 

    // Proveravamo da li korisnik poseduje recept
    const query = 'SELECT * FROM recepti WHERE rec_id = ? AND user_id = ?';
    conn.execute(query, [rec_id, user_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom provere recepta:', err);
            return res.status(500).send('Greška na serveru');
        }

        if (results.length > 0) {
            // Ako je korisnik kreator, dozvoljava se brisanje
            const deleteQuery = 'DELETE FROM recepti WHERE rec_id = ?';
            conn.execute(deleteQuery, [rec_id], (err, result) => {
                if (err) {
                    console.error('Greška prilikom brisanja recepta:', err);
                    return res.status(500).send('Greška prilikom brisanja recepta');
                }
                res.status(200).send('Recept uspešno obrisan');
            });
        } else {
            res.status(403).send('Nemate ovlašćenja za brisanje ovog recepta');
        }
    });
});

// API za dobijanje svih sastojaka
app.get('/sastojci', (req, res) => {
    const query = 'SELECT * FROM sastojci';
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja sastojaka:', err);
            return res.status(500).send('Greška prilikom dobavljanja sastojaka');
        }
        res.json(results);
    });
});

// API za dobijanje svih mernih jedinica
app.get('/merne_jedinice', (req, res) => {
    const query = 'SELECT * FROM mernejedinice';
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja mernih jedinica:', err);
            return res.status(500).send('Greška prilikom dobavljanja mernih jedinica');
        }
        res.json(results);
    });
});

// API za dodavanje komentara
app.post('/komentari', (req, res) => {
    const { kom_sadrzaj, user_id, rec_id } = req.body;

    if(!kom_sadrzaj || !user_id || !rec_id){
        return res.status(400).send('Nedostaju obavezni podaci');
    }

    const query = `INSERT INTO komentari (kom_sadrzaj,kom_datum_postavljanja, user_id, rec_id) 
                   VALUES (?, NOW(), ?, ?)`;
    conn.execute(query, [kom_sadrzaj, user_id, rec_id], (err, result) => {
        if (err) {
            console.error('Greška prilikom unosa komentara:', err);
            return res.status(500).send('Greška prilikom unosa komentara');
        }
        res.status(201).send('Komentar uspešno dodat');
    });
});

// API za dobijanje komentara za odredjeni recept
app.get('/komentari/:rec_id', (req, res) => {
    const rec_id = req.params.rec_id;

    const query = `SELECT k.*, u.user_Fname, u.user_Lname FROM komentari k
                   JOIN users u ON k.user_id = u.user_id
                   WHERE k.rec_id = ?`;
    conn.query(query, [rec_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja komentara:', err);
            return res.status(500).send('Greška na serveru');
        }
        res.json(results);
    });
});

// API za brisanje komentara
app.delete('/komentari/:kom_id/:user_id', (req, res) => {
    const kom_id = req.params.kom_id;
    const user_id = req.body.user_id; 

    // Proveravamo da li korisnik poseduje komentar ili je admin
    const query = `SELECT k.user_id AS komentator_id, r.user_id AS recept_owner_id, u.user_level 
                   FROM komentari k 
                   JOIN recepti r ON k.rec_id = r.rec_id
                   JOIN users u ON u.user_id = ?
                   WHERE k.kom_id = ?`;
    conn.query(query, [user_id, kom_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom provere prava na brisanje komentara:', err);
            return res.status(500).send('Greška na serveru');
        }

        // Proveravamo da li je trenutni korisnik vlasnik komentara ili recepta ili admin
        if (results.length > 0) {
            const komentator_id = results[0].komentator_id;
            const recept_owner_id = results[0].recept_owner_id;
            const user_level = results[0].user_level;

            console.log('Komentator ID:', komentator_id);
            console.log('Recept owner ID:', recept_owner_id);
            console.log('Trenutni user ID:', user_id);
            console.log('User level:', user_level);

            if (komentator_id == user_id || recept_owner_id == user_id || user_level == 1) {
                // Ako je korisnik vlasnik komentara, vlasnik recepta, ili admin, dozvoljava se brisanje
                const deleteQuery = 'DELETE FROM komentari WHERE kom_id = ?';
                conn.execute(deleteQuery, [kom_id], (err, result) => {
                    if (err) {
                        console.error('Greška prilikom brisanja komentara:', err);
                        return res.status(500).send('Greška prilikom brisanja komentara');
                    }
                    res.status(200).send('Komentar uspešno obrisan');
                });
            } else {
                res.status(403).send('Nemate ovlašćenja za brisanje ovog komentara');
            }
        } else {
            res.status(404).send('Komentar nije pronađen');
        }
    });
});

// API za kreiranje nove liste
app.post('/lista', (req, res) => {
    const { lis_naziv, user_id } = req.body;

    const query = 'INSERT INTO lista (lis_naziv, user_id) VALUES (?, ?)';
    conn.execute(query, [lis_naziv, user_id], (err, result) => {
        if (err) {
            console.error('Greška prilikom kreiranja liste:', err);
            return res.status(500).send('Greška prilikom kreiranja liste');
        }
        res.status(201).send({ message: 'Lista uspešno kreirana', lis_id: result.insertId });
    });
});

// API za dodavanje recepta u listu
app.post('/lista/:lis_id/recept', (req, res) => {
    const { rec_id, user_id } = req.body;
    const lis_id = req.params.lis_id;


    if (!user_id) {
        return res.status(400).send('Nedostaje user_id');
    }

    console.log('Received user_id:', user_id);
    console.log('rec_id:', rec_id);
    console.log('lis_id:', lis_id);

    const userQuery = 'SELECT user_id FROM users WHERE user_id = ?';
    conn.execute(userQuery, [user_id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).send('Nemate ovlascenja za dodavanje recepata u listu.');
        }

        

        const query = 'INSERT INTO listarecepata (lis_id, rec_id) VALUES (?, ?)';
        conn.execute(query, [lis_id, rec_id], (err) => {
            if (err) {
                console.error('Greška prilikom dodavanja recepta u listu:', err);
                console.error('Upit:', query);
                console.error('Parametri', lis_id, rec_id);
                return res.status(500).send('Greška prilikom dodavanja recepta u listu');
            }
            res.status(201).send('Recept uspešno dodat u listu');
        });
    });
});

// API za prikazivanje svih lista korisnika
app.get('/liste/:user_id', (req, res) => {
    const user_id = req.params.user_id;

    const query = 'SELECT * FROM lista WHERE user_id = ?';
    conn.execute(query, [user_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja lista:', err);
            return res.status(500).send('Greška prilikom dobavljanja lista');
        }
        res.json(results);
    });
});

// API za prikazivanje recepata unutar određene liste
app.get('/lista/:lis_id/recepte', (req, res) => {
    const lis_id = req.params.lis_id;

    const query = `SELECT r.* FROM recepti r
                   JOIN listarecepata lr ON r.rec_id = lr.rec_id
                   WHERE lr.lis_id = ?`;
    conn.execute(query, [lis_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja recepata iz liste:', err);
            return res.status(500).send('Greška prilikom dobavljanja recepata iz liste');
        }
        res.json(results);
    });
});

app.get('/recepti/:id', (req, res) => {
    const rec_id = req.params.id;

    const query = `SELECT r.rec_naziv, r.rec_priprema, r.rec_vremepripreme, r.rec_brojljudi, rs.rsa_kolicina, s.sas_naziv, m.mer_naziv 
                   FROM recepti r
                   JOIN receptisastojci rs ON r.rec_id = rs.rec_id
                   JOIN sastojci s ON rs.sas_id = s.sas_id
                   JOIN mernejedinice m ON rs.mer_id = m.mer_id 
                   WHERE r.rec_id = ?`;

    conn.query(query, [rec_id], (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja detalja recepta:', err);
            return res.status(500).send('Greška na serveru');
        }


        if (results.length === 0) {
            console.log('Recept nije pronadjen za rec_id',rec_id);
            return res.status(404).send('Recept nije pronađen');
        }

        // Grupisanje podataka o receptu i sastojcima
        const recept = {
            rec_id: rec_id,
            rec_naziv: results[0].rec_naziv,
            rec_priprema: results[0].rec_priprema,
            rec_vremepripreme: results[0].rec_vremepripreme,
            rec_brojljudi: results[0].rec_brojljudi,
            sastojci: results.map(row => ({
                sas_naziv: row.sas_naziv,
                rsa_kolicina: row.rsa_kolicina,
                mer_naziv: row.mer_naziv
            }))
        };


        res.json(recept);
    });
});

// API za uklanjanje recepta iz liste
app.delete('/lista/:lis_id/recept/:rec_id', (req, res) => {
    const lis_id = req.params.lis_id;
    const rec_id = req.params.rec_id;

    const query = 'DELETE FROM listarecepata WHERE lis_id = ? AND rec_id = ?';
    conn.execute(query, [lis_id, rec_id], (err, result) => {
        if (err) {
            console.error('Greška prilikom uklanjanja recepta iz liste:', err);
            return res.status(500).send('Greška prilikom uklanjanja recepta iz liste');
        }
        res.status(200).send('Recept uspešno uklonjen iz liste');
    });
});

app.get('/javneListe', (req, res) => {
    const query = 'SELECT * FROM lista WHERE lis_javno = 1';
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja javnih lista:', err);
            return res.status(500).send('Greška prilikom dobavljanja javnih lista');
        }
        res.json(results);
    });
});

app.get('/publicRecepti', (req, res) => {
    const query = 'SELECT * FROM recepti WHERE rec_javno = 1'; // Primer: dodati logiku za javne recepte
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom dobavljanja javnih recepata:', err);
            return res.status(500).send('Greška prilikom dobavljanja recepata');
        }
        res.json(results);
    });
});










  
  


