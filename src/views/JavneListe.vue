<template>
    <div>
      <h1>Javne Liste</h1>
      <div v-if="javneListe.length > 0">
        <div v-for="lista in javneListe" :key="lista.lis_id">
          <h3>{{ lista.lis_naziv }}</h3>
        </div>
      </div>
      <div v-else>
        <p>Nema listi.</p>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'JavneListe',
    data() {
      return {
        javneListe: []
      };
    },
    created() {
      this.dobaviJavneListe();
    },
    methods: {
      dobaviJavneListe() {
        axios.get('http://localhost:3000/javneListe')
          .then(response => {
            this.javneListe = response.data;
          })
          .catch(error => {
            console.error('Greška prilikom dobavljanja javnih lista:', error);
          });
      }
    }
  };
  </script>
  
  <style>
  </style>
  