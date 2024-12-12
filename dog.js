function Dog(id) {
  this.id = id;
  if (!this.id) {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = urlParams.get('breed');
    this.id = decodeURIComponent(raw);
  }

  function isTokenExpired(token) {
    if (!token) return true;

    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.warn(error);
      return true;
    }
  }

  this.getToken = async () => {

    const currToken = sessionStorage.getItem('jwtToken');
    if (currToken && !isTokenExpired(currToken)) return currToken;

    const requestOptions = {
      method: "POST",
      redirect: "follow",
    };

    try {
      const response = await fetch("https://doggo-api-inky.vercel.app/api/v1/auth/issue-token", requestOptions);
      const { token } = await response.json();
      if (!token) throw new Error('No token found in response');
      sessionStorage.setItem('jwtToken', token);
      return token;
    } catch (error) {
      console.error(error);
    }
  };

  this.getBreedData = async () => {

    const cachedData = sessionStorage.getItem(this.id);
    if (cachedData) return JSON.parse(cachedData);

    const token = await this.getToken();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${token}`);

    const body = JSON.stringify({
      path: `v1/breeds/${this.id}`,
      method: "GET"
    });

    const requestOptions = {
      method: "POST",
      redirect: "follow",
      headers,
      body,
    };

    try {
      const response = await fetch("https://doggo-api-inky.vercel.app/api/v1/proxy", requestOptions);
      const json = await response.json();
      if (json) {
        sessionStorage.setItem(this.id, JSON.stringify(json));
      }
      return json;
    } catch (error) {
      console.error(error);
    }
  };

  const init = async () => {
    if (this.id) {
      const breedData = await this.getBreedData();
      console.log('BREED DATA:', breedData);
    }
  };

  init();

}

const dog = new Dog();