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

  const init = async () => {
    if (this.id) {
      const token = await this.getToken();
      console.log('TOKEN:', token);
    }
  };

  init();

}

const dog = new Dog();