<template>
  <div id="app">
    <nav class="navbar">
        <div class="nav-brand">
          <img src="@/assets/Recipe_Vault_Logo.png" alt="Logo" class="logo" />
        </div>
        <button class="nav-toggle" @click="toggleMenu">
          ☰
        </button>
        <ul :class="{'nav-menu': true, 'nav-active': isMenuOpen}">
          <li><router-link to="/">Home</router-link></li>
          <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
          <li v-if="isLoggedIn"><router-link to="/welcome">Profil</router-link></li>
          <li v-if="isLoggedIn"><button @click="logout">Logout</button></li>
          <li><router-link to="/javneliste">JavneListe</router-link></li>
        </ul>
    </nav>

    <router-view></router-view>
  </div>
    
</template>

<script>
export default {
  data() {
    return {
      isMenuOpen: false,
      isLoggedIn: false
    };
  },

  created(){
    this.checkUserStatus();
  },
  
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    logout(){
      localStorage.removeItem('user'); //Brisanje korisnickih podataka
      this.isLoggedIn=false;
      this.$router.push('/login'); //redirekcija na login stranicu
    },

    checkUserStatus(){
      const user=localStorage.getItem('user');
      this.isLoggedIn= !!user;
    }
    

  },
  watch:{
    $route(){
      this.checkUserStatus();
    }
  }
  
};
</script>

<style lang="scss">

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #e5aa4e;
  padding: 0.5rem 1rem;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #e5aa4e;
  padding: 0.25rem 1rem;
  position: relative;
  height: 60px;
}

.nav-menu {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu li {
  margin-left: 1.5rem;
}

.nav-menu a, .nav-menu button {
  padding: 0.25rem 0.75rem;
  margin-left: 1rem;
  display: flex;
  align-items: center;
  color: white;
  text-decoration: none;
  transition: background-color 0.3s;
  font-size: 1.05rem;
}

.nav-menu a:hover, .nav-menu button:hover {
  background-color: #575757;
  border-radius: 5px;
}

.nav-menu button {
  background-color: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s, border-color 0.3s;
}

.nav-menu button:hover {
  background-color: #575757;
  border-color: #575757;
  color: white;
}

.logo {
  width: 100px; 
  height: auto; 
  max-height: 50px; 
  object-fit: contain; 
  padding: 0; 
  margin: 0; 
  
}

.nav-toggle {
  display: none;
  font-size: 1.5rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .nav-menu {
    display: none;
    flex-direction: column;
    width: 100%;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: #e49e12;
    z-index: 1;
  }

  .nav-menu.nav-active {
    display: flex;
    flex-direction: column;
  }

  .nav-menu li{
    margin: 0;
    text-align: center;
    width: 100%;
  }

  .nav-menu a, .nav-menu button {
    margin: 0;
    text-align: center;
    width: 100%;
    padding: 1rem;
  }

  .nav-menu button {
    background-color: transparent;
    border: 2px solid white;
    color: white;
    width: 100%;
  }
}


</style>
