<template>
  <div class="home">
    <h1>Svi recepti</h1>
    <div v-if="recepti && recepti.length===0">
      <p>Nema recepata za prikazivanje.</p>
    </div>

    <div v-else>
      <div class="recipe-container">
        <div v-for="recept in recepti" :key="recept.rec_id" class="recipe-box">
          <h2>{{ recept.rec_naziv }}</h2>
          <p>Vreme pripreme:{{ recept.rec_vremepripreme }} minuta</p>
          <p>Broj ljudi: {{ recept.rec_brojljudi }}</p>
          <p>{{ skratiOpis(recept.rec_priprema) }}</p>
          <button @click="otvoriModal(recept)">Detalji</button>
          <button @click="otvoriModalZaListu(recept)">+</button>
          

        </div>
      </div>
    </div>

    

    <div v-if="prikaziModalZaDodavanje" class="modal" @click.self="zatvoriModalZaDodavanje">
      <div class="modal-content">
        <span class="close" @click="zatvoriModalZaDodavanje">&times;</span>
        <h2>Dodaj recept u listu</h2>
        <div>
            <label for="izabranaLista">Odaberi listu:</label>
            <select v-model="izabranaLista" id="izabranaLista">
                <option v-for="lista in liste" :key="lista.lis_id" :value="lista.lis_id">{{ lista.lis_naziv }}</option>
            </select>
        </div>
        <button v-if="user_id" @click="dodajReceptUListu">Dodaj u listu</button>
      </div>
    </div>


    <!--prikaz celog recepta u modal prozoru-->

    <div v-if="izabraniRecept && izabraniRecept.sastojci" class="modal" @click.self="zatvoriModal">
      <div class="modal-content">
        <span class="close" @click="zatvoriModal">&times;</span>
        <h2>{{ izabraniRecept.rec_naziv }}</h2>
        <h3>Sastojci:</h3>
        <ul>
          <li v-for="sastojak in izabraniRecept.sastojci" :key="sastojak.sas_naziv">
            {{ sastojak.sas_naziv }} - {{ parseInt(sastojak.rsa_kolicina) }} {{ sastojak.mer_naziv }} 
          </li>
        </ul>
        <p>Opis pripreme:{{ izabraniRecept.rec_priprema }}</p>
        <p>Vreme pripreme: {{ izabraniRecept.rec_vremepripreme }} minuta</p>
        <p>Broj ljudi: {{ izabraniRecept.rec_brojljudi }}</p>

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
              <button v-if="mozeBrisatiKomentar(komentar)" @click="obrisiKomentar(komentar.kom_id)">Obriši</button>

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
    

  </div>
</template>

<script>
import axios from 'axios';

export default {
 name: 'HomeView',
 data(){
  return{
    user_level:null,
    recepti:[], 
    izabraniRecept:null, 
    sastojci:[],
    noviKomentar:'',
    komentari:[],
    user_id:null,
    prikaziModalZaDodavanje:false,
    receptZaDodavanje:null,
    prikaziModalZaListu:false,
    izabranaLista:null,
    liste:[],
    receptiIzListe:[],

  };
 },
 mounted(){
  axios.get('http://localhost:3000/recepti') 
    .then(response=>{
      this.recepti=response.data; 
  })
  .catch(error=>{
    console.error('Greska prilikom dobavljanja recepata:',error);
  });

  this.dobaviListe();
 },

 created(){
  const user=JSON.parse(localStorage.getItem('user'));
  if(user){
    this.userFname = user.user_Fname;
    this.userLname = user.user_Lname;
    this.user_id=user.user_id;
    console.log('Učitani user_id:', this.user_id)
    this.user_level=user.user_level;
  }else{
    console.log("User nije pronadjen u localStorage");
  }
 },

 methods:{

  otvoriModal(recept){
    this.izabraniRecept=recept;
    this.dobaviKomentare();
  },
  zatvoriModal(){
    this.izabraniRecept=null;

  },

  skratiOpis(opis){
    if(opis.length>100){
      return opis.substring(0,100)+'...';
    }
    return opis;
  },

  dodajKomentar(){
    if(!this.user_id){
      console.error('User ID nije definisan');
      return;

    }
    

    const komentarData={
      kom_sadrzaj: this.noviKomentar,
      user_id: this.user_id,
      rec_id: this.izabraniRecept.rec_id
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

  otvoriModalZaListu(recept) {
    if (!this.user_id) {
        alert('Morate biti ulogovani da biste dodali recept u listu.');
        return;
    }
    this.receptZaDodavanje = recept;
    this.prikaziModalZaDodavanje = true;
  },
  zatvoriModalZaDodavanje() {
    this.prikaziModalZaDodavanje = false;
    this.receptZaDodavanje = null;
  },
  dodajUListu(rec_id, lis_id) {
    axios.post(`http://localhost:3000/lista/${lis_id}/recept`, { rec_id})
    .then(() => {
      alert('Recept je uspešno dodat u listu!');
      this.zatvoriModalZaDodavanje();
    })
    .catch(error => {
      console.error('Greška prilikom dodavanja recepta u listu:', error);
    });
  },

  zatvoriModalListe() {
    this.prikaziModalZaListu = false;
  },
  dobaviListe() {
    axios.get('http://localhost:3000/liste/' + this.user_id)
    .then(response => {
      this.liste = response.data;
    })
    .catch(error => {
      console.error('Greška prilikom dobavljanja listi:', error);
    });
  },

  dodajReceptUListu() {


    if (!this.user_id) {
      alert('Morate biti ulogovani da biste dodali recept u listu.');
      return;
    }
    if (!this.izabranaLista) {
        alert('Morate izabrati listu.');
        return;
    }
    if (!this.receptZaDodavanje || !this.receptZaDodavanje.rec_id) {
        console.error('rec_id nije definisan.');
        alert('Došlo je do greške, recept nije ispravno postavljen.');
        return;
    }


    axios.post(`http://localhost:3000/lista/${this.izabranaLista}/recept`, {
      rec_id: this.receptZaDodavanje.rec_id,
      user_id: this.user_id
    
    })
    .then(() => {
      alert('Recept je uspešno dodat u listu');
      this.zatvoriModalZaDodavanje();
    })
    .catch(error => {
      console.error('Greška prilikom dodavanja recepta u listu:', error);
    });
  },

  otvoriModalZaDodavanje(recept){
    if(!this.user_id){
      alert('Morate biti ulogovani da biste dodali recept u listu');
      return;
    }
    this.receptZaDodavanje=recept;
    this.prikaziModalZaDodavanje=true;
  }

  
  

 },
  
};
</script>

<style>
.home {
  padding: 20px;
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
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}





.recipe-box:hover{
  transform: scale(1.05);
}


h2 {
  margin: 0;
  font-size: 1.5em;
}

/* Modalni prozor */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Pozadinska providnost */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Sadržaj modalnog prozora */
.modal-content {
  position: relative;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 500px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);
}

.modal-content ul {
  list-style-type:none;
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