<template>
    <div class="welcome-page">
      <h1> {{ userFname }} {{ userLname }}, radujemo se tvojim novim receptima!🍕🥗🍲</h1>

      <div class="tabs">
        <button :class="{acitve: currentTab ==='recepti'}" @click="currentTab='recepti'" >Moji recepti</button>
        <button :class="{active: currentTab==='liste'}" @click="currentTab='liste'">Moje liste</button>
        <button v-if="canAddRecipe && currentTab==='recepti'" @click="prikaziFormu=!prikaziFormu" class="toggle-form">
          {{ prikaziFormu ? 'Zatvori formu' : 'Dodaj recept' }}
        </button>
        <button v-if="currentTab==='liste'" @click="prikaziFormuZaKreiranjeListe=!prikaziFormuZaKreiranjeListe">
          Kreiraj novu listu
        </button>
      </div>

      <div v-if="prikaziFormu && currentTab==='recepti'" class="add-recept">
        <h2>Dodaj novi recept</h2>
        <form @submit.prevent="submitRecept">
          <input type="text" v-model="rec_naziv" placeholder="Naziv recepta" required>
          <div v-for="(sastojak, index) in receptSastojci" :key="index" class="sastojak-form">
            <input type="text" v-model="sastojak.naziv" placeholder="Naziv sastojka" required>
            <input type="number" v-model.number="sastojak.rsa_kolicina" placeholder="Količina" required>
            <select v-model="sastojak.mer_id">
              <option v-for="m in merneJedinice" :key="m.mer_id" :value="m.mer_id">{{ m.mer_naziv }}</option>
            </select>
            <button @click.prevent="ukloniSastojak(index)">Ukloni</button>
          </div>
          <button @click.prevent="dodajSastojak">Dodaj sastojak</button>
          <textarea v-model="rec_priprema" placeholder="Opis pripreme" required></textarea>
          <input type="number" v-model.number="rec_vremepripreme" placeholder="Vreme pripreme (minuti)" required>
          <input type="number" v-model.number="rec_brojljudi" placeholder="Broj osoba" required>
          <button type="submit">Dodaj recept</button>
        </form>

        <p v-if="message">{{ message }}</p>
      </div>

      <div v-if="currentTab==='recepti'">
        <div class="recipe-container" v-if="korisnickiRecepti.length > 0">
          <div v-for="recept in korisnickiRecepti" :key="recept.rec_id" class="recipe-box">
            <h3>{{ recept.rec_naziv }}</h3>
            <p>Vreme pripreme: {{ recept.rec_vremepripreme }} minuta</p>
            <p>Broj ljudi: {{ recept.rec_brojljudi }}</p>
            <p>{{ skratiOpis(recept.rec_priprema) }}</p>
            <button @click="otvoriModal(recept)">Detalji</button>
            <button @click="otvoriFormuZaIzmenu(recept)">Izmeni</button>
            <button @click="obrisiRecept(recept.rec_id)">Obriši</button>

          </div>

        </div>
        <p v-else>Nema recepata za prikazivanje</p>
      </div>

      <!--Prikaz listi-->
      <div v-if="currentTab==='liste'">
        
        <div v-if="liste.length > 0">
          <div v-for="lista in liste" :key="lista.lis_id">
            <h3 @click="prikaziRecepteIzListe(lista.lis_id)">{{ lista.lis_naziv }}</h3>
          </div>
        </div>
        <div v-else>
          <p>Nemate kreirane liste.</p>
        </div>

        <!-- Prikaz recepata iz izabrane liste -->
        <div v-if="receptiIzListe.length > 0">
          <div v-for="recept in receptiIzListe" :key="recept.rec_id">
            <h3 @click="prikaziDetaljeRecepta(recept)">{{ recept.rec_naziv }}</h3>
            <button @click="ukloniReceptIzListe(recept.rec_id, izabranaListaId)">Ukloni</button>
          </div>
        </div>
      </div>
      <!-- Modalni prozor za prikaz recepta -->
      <div v-if="prikaziDetalje && izabraniRecept && izabraniRecept.sastojci" class="modal" @click.self="zatvoriModal">
        <div class="modal-content">
          <span class="close" @click="zatvoriModal">&times;</span>
          <h2>{{ izabraniRecept.rec_naziv }}</h2>
          <h3>Sastojci:</h3>
          <ul>
            <li v-for="sastojak in izabraniRecept.sastojci" :key="sastojak.sas_naziv">
              {{ sastojak.sas_naziv }} - {{ parseInt(sastojak.rsa_kolicina) }} {{ sastojak.mer_naziv }} 
            </li>
          </ul>
          <p>Opis pripreme: {{ izabraniRecept.rec_priprema }}</p>
          <p>Vreme pripreme: {{ izabraniRecept.rec_vremepripreme }} minuta</p>
          <p>Broj ljudi: {{ izabraniRecept.rec_brojljudi }}</p>
        </div>
      </div>


      <!-- Modalni prozor za kreiranje nove liste -->
      <div v-if="prikaziFormuZaKreiranjeListe" class="modal" @click.self="zatvoriModal">
        <div class="modal-content">
          <span class="close" @click="zatvoriModal">&times;</span>
          <h2>Kreiraj novu listu</h2>
          <form @submit.prevent="dodajListu">
            <input type="text" v-model="novaListaNaziv" placeholder="Naziv liste" required>
            <button type="submit">Kreiraj listu</button>
          </form>
        </div>
      </div>


      <div>
        <!--Modalni prozor za prikaz celog recepta-->
        <div v-if="izabraniRecept" class="modal" @click.self="zatvoriModal">
          <div class="modal-content">
            <span class="close" @click="zatvoriModal">&times;</span>
            <h2>{{ izabraniRecept.rec_naziv }}</h2>
            <h3>Sastojci:</h3>
            <ul>
              <li v-for="sastojak in izabraniRecept.sastojci" :key="sastojak.sas_naziv">
                {{ sastojak.sas_naziv }} - {{ parseInt(sastojak.rsa_kolicina) }} {{ sastojak.mer_naziv }} 
              </li>
            </ul>
            <p>Opis pripreme: {{ izabraniRecept.rec_priprema }}</p>
            <p>Vreme pripreme:{{ izabraniRecept.rec_vremepripreme }} minuta</p>
            <p>Broj ljudi:{{ izabraniRecept.rec_brojljudi }}</p>
            <h3>Komentari:</h3>
            <ul v-if="izabraniRecept.komentari && izabraniRecept.komentari.length>0">
              <li v-for="komentar in izabraniRecept.komentari" :key="komentar.kom_id">
                {{ komentar.kom_sadrzaj }} - {{ komentar.kom_datum_postavljanja }}
                <button v-if="mozeBrisatiKomentar(komentar)" @click="obrisiKomentar(komentar.kom_id)">Obriši</button>
              </li>
            </ul>

            <div v-if="komentari.length">
              <ul>
                <li v-for="komentar in komentari" :key="komentar.kom_id">
                  <strong>{{ komentar.user_Fname }} {{ komentar.user_Lname }}:</strong>
                  <button v-if="canDeleteComment(komentar)" @click="obrisiKomentar(komentar.kom_id)">Obriši</button>

                </li>
              </ul>
            </div>
            <p v-else>Nema komentara za prikazivanje.</p>


            <!--Forma za dodavanje novog komentara-->
            <form @submit.prevent="dodajKomentar">
              <textarea v-model="noviKomentar" placeholder="Dodaj komentar"></textarea>
              <button type="submit">Dodaj komentar</button>
            </form>

          </div>
        </div>  
        <!--Forma za izmenu recepta-->
        <div v-if="prikaziFormuZaIzmenu" class="modal">
          <div class="modal-content">
            <span class="close" @click="zatvoriModal">&times;</span>
            <h2>Izmeni recept</h2>
            <form @submit.prevent="izmeniRecept">
              <input type="text" v-model="rec_naziv" placeholder="Naziv recepta" required>
              <div v-for="(sastojak,index) in receptSastojci" :key="index" class="sastojak-form">
                <input type="text" v-model="sastojak.sas_naziv" placeholder="Sastojak" required>
                <input type="number" v-model.number="sastojak.rsa_kolicina" placeholder="Količina" required>
                <select v-model="sastojak.mer_id">
                  <option v-for="m in merneJedinice" :key="m.mer_id" :value="m.mer_id">{{ m.mer_naziv }}</option>
                </select>
                <button @click.prevent="ukloniSastojak(index)">Ukloni</button>  
              </div>
              <button @click.prevent="dodajSastojak">Dodaj sastojak</button>
              <textarea v-model="rec_priprema" placeholder="Opis pripreme" required></textarea>
              <input type="number" v-model.number="rec_vremepripreme" placeholder="Vreme pripreme(minuti)" required>
              <input type="number" v-model.number="rec_brojljudi" placeholder="Broj osoba" required>
              <button type="submit">Sacuvaj izmene</button>
            </form>

          </div>
        </div>  
      </div>
  </div>
</template>

  
<script>

  import axios from 'axios';

  export default {
    name: 'WelcomePage',
    data() {
      return {
        userFname: '',
        userLname: '',
        user_id:null,
        user_level:null,
        currentTab:'recepti',
        canAddRecipe:false, 
        prikaziFormu:false, 
        prikaziFormuZaIzmenu:false,
        rec_naziv:'',
        rec_sastojci:'',
        rec_priprema:'',
        rec_vremepripreme:'',
        rec_brojljudi:'',
        message:'',
        korisnickiRecepti:[], 
        izabraniRecept:null,
        sastojci:[],
        merneJedinice:[],
        receptSastojci:[
          {sas_id:null,mer_id:null,rsa_kolicina:null}
        ],
        noviKomentar:'',
        komentari:[],
        novaLista:'',
        prikaziFormuZaKreiranjeListe:false,
        novaListaNaziv:'',
        liste:[],
        receptiIzListe:[],
        prikaziDetalje:false,
        izabranaListaId:null,
      };
    },
    created() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        this.userFname = user.user_Fname;
        this.userLname = user.user_Lname;
        this.user_id=user.user_id;
        this.user_level=user.user_level;


        if(this.user_level===2){
          this.canAddRecipe=true;

        }
        else{
          console.log('Korisnik nema ovlascenja, canAddRecipe:', this.canAddRecipe);
        }
        
        this.dobaviRecepte();
        this.dobaviListe();
      } else{
        console.log("User nije pronadjen u localStorage");
      }
      this.dobaviSastojke();
      this.dobaviMerneJedinice();
    },
    methods:{
      dobaviSastojke(){
        axios.get('http://localhost:3000/sastojci')
          .then(response=>{
            this.sastojci=response.data;
          })
          .catch(error=>{
            console.error('Greska prilikom dobavljanja sastojaka',error);
          });
      },
      dobaviMerneJedinice(){
        axios.get('http://localhost:3000/merne_jedinice')
          .then(response=>{
            this.merneJedinice=response.data;
          })
          .catch(error=>{
            console.error('Greska prilikom dobavljanja mernih jedinica',error);
          });
      },
      dodajSastojak(){
        this.receptSastojci.push({sas_id:null,mer_id:null,rsa_kolicina:null});
      },
      ukloniSastojak(index){
        this.receptSastojci.splice(index,1);
      },
      logout(){
        localStorage.removeItem('user');
        this.$router.push('/login');
      },
      submitRecept(){
        if(this.user_id){
          const sastojciZaSlanje=this.receptSastojci.map(sastojak=>({
            naziv:sastojak.naziv,
            mer_id:sastojak.mer_id,
            rsa_kolicina:sastojak.rsa_kolicina,
          }));

          axios.post('http://localhost:3000/recepti',{
            rec_naziv:this.rec_naziv,
            rec_priprema:this.rec_priprema,
            rec_vremepripreme:this.rec_vremepripreme,
            rec_brojljudi:this.rec_brojljudi,
            sastojci: sastojciZaSlanje,
            user_id:this.user_id,
          }).then(() =>{
            this.message='Recept je uspesno dodat!';
            this.resetForm();
            this.dobaviRecepte(); 
          }).catch(error=>{

            console.error('Greska prilikom dodavanja recepta',error);
            this.message='Doslo je do greske prilikom dodavanja recepta.';
          });

        }
      },
      dobaviRecepte(){
          axios.get(`http://localhost:3000/recepti/user/${this.user_id}`)
          .then(response=>{
            this.korisnickiRecepti=response.data;
          })
          .catch(error=>{
            console.error('Greska prilikom dobavljanja recepata:',error);
          });
      },
      otvoriModal(recept){
        console.log('Otvaranje modalnog prozora za recept:', recept);

        this.izabraniRecept=recept;
        this.dobaviKomentare();
        console.log('Sadržaj izabraniRecept nakon postavljanja:', this.izabraniRecept)

      },
      zatvoriModal(){
        this.izabraniRecept=null;
        this.prikaziFormuZaIzmenu=false;
        this.prikaziFormuZaKreiranjeListe=false;
        this.prikaziDetalje=false;
      },

      skratiOpis(opis){
        if(opis.length>100){
          return opis.substring(0,100)+'...';
        }
          return opis;
      }, 
      resetForm(){
        this.rec_naziv='',
        this.rec_priprema='',
        this.rec_vremepripreme='';
        this.rec_brojljudi='';
        this.rec_sastojci='';
        this.izabraniRecept=null;
      },
      otvoriFormuZaIzmenu(recept) {
        if(recept){
          this.izabraniRecept = recept;
          this.rec_naziv = recept.rec_naziv || '';
          this.rec_priprema = recept.rec_priprema || '';
          this.rec_vremepripreme = recept.rec_vremepripreme || '';
          this.rec_brojljudi = recept.rec_brojljudi || '';
          this.receptSastojci=recept.sastojci.map(s=>({
            sas_naziv:s.sas_naziv,
            rsa_kolicina:s.rsa_kolicina,
            mer_id:s.mer_id,
          }));
          this.prikaziFormuZaIzmenu = true; 

        }
        
      },
      izmeniRecept() {
        const vremePripreme=this.rec_vremepripreme ? this.rec_vremepripreme : null;
        const brojLjudi=this.rec_brojljudi ? this.rec_brojljudi : null;
        

        axios.put(`http://localhost:3000/recepti/${this.izabraniRecept.rec_id}`, {
          rec_naziv: this.rec_naziv,
          rec_priprema: this.rec_priprema,
          rec_vremepripreme: vremePripreme,  
          rec_brojljudi: brojLjudi,
          sastojci: this.receptSastojci,
        })
        .then(() => {
          this.message = 'Recept je uspešno izmenjen';
          this.resetForm();
          this.prikaziFormuZaIzmenu=false; 
          this.dobaviRecepte();
        })
        .catch(error => {
          console.error('Greška prilikom izmene recepta', error);
          this.message = 'Došlo je do greške prilikom izmene recepta.';
        });
      


      },
      obrisiRecept(rec_id){
        if(confirm('Da li ste sigurni da zelite da obrisete recept')){
          axios.delete(`http://localhost:3000/recepti/${rec_id}/${this.user_id}`,{data:{user_id:this.user_id}})
          .then(()=>{
            this.message='Recept je uspesno obrisan';
            this.dobaviRecepte();
          })
          .catch(error=>{
            console.error('Greska prilikom brisanja recepta:',error);
          });
        }
      },

      dodajKomentar(){

        if(!this.user_id){
          console.error('User ID nije definisan');
          return;

        }

        const komentarData={
          kom_sadrzaj:this.noviKomentar,
          user_id:this.user_id,
          rec_id:this.izabraniRecept.rec_id
        };

        axios.post('http://localhost:3000/komentari',komentarData)
        .then(()=>{
          alert('Komentar je uspesno dodat');
          this.noviKomentar='';
          this.dobaviKomentare();
        })
        .catch(error=>{
          console.error('Greska prilikom dodavanja komentara', error);
        });
      },

      dobaviKomentare(){
        axios.get(`http://localhost:3000/komentari/${this.izabraniRecept.rec_id}`)
        .then(response=>{
          this.izabraniRecept.komentari=response.data.length > 0 ? response.data:[];
        })
        .catch(error=>{
          console.error('Greska prilikom dobavljanja komentara', error);
        });
      },

      obrisiKomentar(kom_id) {

        if (confirm('Da li ste sigurni da želite da obrišete ovaj komentar?')) {
          axios.delete(`http://localhost:3000/komentari/${kom_id}/${this.user_id}`)
          .then(() => {
            alert('Komentar je uspešno obrisan.');
            this.dobaviKomentare(this.izabraniRecept.rec_id); 
          })
          .catch(error => {
            console.error('Greška prilikom brisanja komentara:', error);
          });
        }
      },

      mozeBrisatiKomentar(komentar) {
        return this.user_level === 1 || this.user_id === komentar.user_id;
      },

      dodajListu() {
        const listaData = {
          lis_naziv: this.novaListaNaziv,
          user_id: this.user_id
        };
    
        axios.post('http://localhost:3000/lista', listaData)
        .then(() => {
          alert('Lista je uspešno kreirana');
          this.prikaziFormuZaKreiranjeListe = false;
          this.novaListaNaziv = '';
        })
        .catch(error => {
          console.error('Greška prilikom kreiranja liste:', error);
        });
      },

      dobaviListe() {
        axios.get(`http://localhost:3000/liste/${this.user_id}`)
        .then(response => {
          this.liste = response.data;
        })
        .catch(error => {
          console.error('Greška prilikom dobavljanja listi:', error);
        });
      },
      prikaziRecepteIzListe(lis_id) {
        this.izabranaListaId=lis_id;
        axios.get(`http://localhost:3000/lista/${lis_id}/recepte`)
        .then(response => {
          this.receptiIzListe = response.data;
        })
        .catch(error => {
          console.error('Greška prilikom dobavljanja recepata iz liste:', error);
        });
      },

      prikaziDetaljeRecepta(recept){
        axios.get(`http://localhost:3000/recepti/${recept.rec_id}`)
        .then(response =>{
          console.log('dobijeni podaci:', response.data);

          this.izabraniRecept=response.data;
          this.prikaziDetalje=true;

          
          if (Array.isArray(response.data)&& response.data.length > 0) {
            this.izabraniRecept=response.data[0];
            this.prikaziDetalje=true;
          } else {
            console.error('Nedostaju podaci za recept');
          }
        })
        .catch(error => {
          console.error('Greska prilikom dobavljanja recepata:', error)
        });
      },

      ukloniReceptIzListe(rec_id,lis_id){
        axios.delete(`http://localhost:3000/lista/${lis_id}/recept/${rec_id}`)
        .then(()=>{
          alert('Recept uspesno uklonjen iz liste');
          this.prikaziRecepteIzListe(lis_id);
        })
        .catch(error=>{
          console.error('Greska prilikom uklanjanja recepata iz liste',error);
        });
      },

      
    }


      

    
  };
</script>
  
<style>
  .welcome-page {
    padding: 20px;
  }

  .tabs{
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .tabs button{
    padding: 10px 20px;
    margin-right: 5px;
    background-color: #4CAF50;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  .tabs button.active{
    background-color: #007bff;
    color: white;
  }

  .toggle-form{
    padding: 10px 20px;
    background-color: #007bff;
    color:#fff;
    border:none;
    cursor:pointer;
    border-radius: 5px;
    margin-left: 10px;
  }
  
  .actions{
    display: flex;
    justify-content: flex-start;
    margin-bottom: 20px;
  }

  h2{
    margin-top:20px;
  }

  .add-recept {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    width: 80%;
    max-height: 90vh;
    overflow-y: auto;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  input, textarea {
    margin-bottom: 10px;
    padding: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  button {
    padding: 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  button:hover {
    background-color: #45a049;
  }

  .recipe-container{
    display: flex;
    flex-wrap: wrap;
    gap:20px;
  }

  .recipe-box{
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 8px;
    width: 300px;
    box-shadow: 0px 0px 5px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s ease-in-out;

  }

  .recipe-box button{
    margin:5px;
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .recipe-box button:hover {
    background-color: 0056b3;

  }

  .recipe-box:hover {
    transform: scale(1.05);
  }

  h3{
    margin:0;
    cursor: pointer;
    color:blue;
  }

  h3:hover {
    text-decoration: underline;
  }

  .modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  position: relative;
  background-color: #fff;
  margin: 5% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  max-width: 1200px;
  border-radius: 10px;
  overflow-y:auto;
  max-height: 90vh;
}

.modal-content ul {
  list-style-type:none;
}

.sastojak-form{
  display: flex;
  align-items: center;
  gap: 10px;
}

.sastojak-form input,
.sastojak-form select,
.sastojak-form button{
  flex: 1;
}

.sastojak-form button{
  max-block-size: 80px;
}



.close:hover, .close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

/* Dugme za zatvaranje modalnog prozora */
.close {
  position: absolute;
  top: 10px;  /* Umanji razdaljinu od vrha */
  right: 15px;  /* Umanji razdaljinu od desne strane */
  font-size: 1.2rem;  /* Veličina ikone */
  padding: 0;  /* Ukloni padding */
  margin: 0;  /* Ukloni marginu */
  cursor: pointer;
  color: #333;
  border-radius: 50%; /* Okrugli izgled */
  background-color: #f1f1f1;
  width: 30px;  /* Precizna širina */
  height: 30px;  /* Precizna visina */
  display: flex;
  justify-content: center;
  align-items: center;
}

.close:hover {
  background-color: #d35400;
  color: white;
}



  
</style>
  