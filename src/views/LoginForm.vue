<template>
  
  <div class="loginform">
    <img class="login-logo" src="../assets/Recipe_Vault_Logo.png"/>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input type="email" placeholder="mail@example.com" v-model="email">
      <input type="password" placeholder="password" v-model="password">
      <button type="submit" class="loginbutton">Login</button>

    </form>
    
  </div>
  
</template>

<script>
import axios from 'axios';

export default{
  name:'LoginForm',
  data(){
    return{
      email:'',
      password:''
    };
  },
  methods:{
    async login(){
      try{
        const response=await axios.post('http://localhost:3000/login',{
          email:this.email,
          password:this.password
        });

        if(response.status===200){
          localStorage.setItem('user',JSON.stringify(response.data.user));
          this.$router.push('/welcome');
        }

      } catch(error){
        if(error.response && error.response.status===401){
          alert('Pogresno korisnicko ime ili lozinka');
        } else{
          alert('Doslo je do greske prilikom prijave')
        }
      }
    }
  }
};
</script>

<style>

.loginform {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
  padding: 20px;
}
.login-logo {
  width: 100%;
  max-width: 300px;
  height: auto;
  display: block;
  margin: 0 auto 20px;
}

.loginform img {
  display: block;
  margin: 0 auto 20px;
}

.loginform h1 {
  margin-bottom: 20px;
  font-size: 24px;
}

.loginform form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loginform input {
  width: 100%;
  max-width: 300px;
  height: 40px;
  padding-left: 20px;
  margin-bottom: 20px;
  border: 1px solid orange;
  border-radius: 5px;
}

.loginbutton {
  width: 100%;
  max-width: 300px;
  height: 40px;
  border: 1px solid orange;
  background: orange;
  cursor: pointer;
  color: #fff;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.loginbutton:hover {
  background-color: #ff9800;
}

@media (max-width: 768px) {
  .loginform {
    width: 90%;
  }
}




</style>

