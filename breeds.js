function BreedList() {

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

  this.getBreeds = async () => {

    const cachedData = sessionStorage.getItem('breed-list');
    if (cachedData) return JSON.parse(cachedData);

    const token = await this.getToken();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${token}`);

    const body = JSON.stringify({
      path: `v1/breedList`,
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
        sessionStorage.setItem('breed-list', JSON.stringify(json));
      }
      return json;
    } catch (error) {
      console.error(error);
    }
  };

  this.addBreedsToUI = (breeds) => {
    const loc = document.getElementById('breedsList');
    if (loc && breeds.length !== undefined) {
      loc.replaceChildren();
      breeds.forEach((b) => {
        const { breed, slug } = b || {};
        if (!breed || !slug) return;
        const li = document.createElement('li');
        li.classList.add('breed');
        const a = document.createElement('a');
        a.textContent = decodeURIComponent(breed);
        a.href = '/dog.html?breed=' + slug;
        li.appendChild(a);
        loc.appendChild(li);
      });
    }
  };

  this.addButtonFuntionality = () => {

    const removeModal = (event) => {
      const modalEl = document.querySelector('body>.modal');
      const shouldClose = (target) => {
        if (!target) return false;
        while (target) {
          if (target === modalEl) return false;
          target = target.parentElement;
        }
        return true;
      };
      if (modalEl && shouldClose(event.target)) {
        modalEl.style.top = '-55vh';
      }
    };

    const menuBtn = document.querySelector('button.hamburger');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        const modalEl = document.querySelector('body>.modal');
        if (modalEl) {
          modalEl.style.top = '0';
          document.addEventListener("click", removeModal, true);
        }
      });
    }

    const modalEscape = document.querySelector('.modal>button.modalEscape');
    if (modalEscape) {
      modalEscape.addEventListener('click', (event) => {
        const modalEl = document.querySelector('body>.modal');
        if (modalEl) {
          modalEl.style.top = '-55vh';
          document.removeEventListener("click", removeModal);
        }
      });
    }

    function levenshteinDistance(str1, str2) {
      const m = str1.length;
      const n = str2.length;
      const REPLACEMENT_PENALTY = 1;

      let prevRow = new Array(n + 1).fill(0);
      let currRow = new Array(n + 1).fill(0);

      for (let j = 0; j <= n; j++) {
        prevRow[j] = j;
      }

      for (let i = 1; i <= m; i++) {
        currRow[0] = i;

        for (let j = 1; j <= n; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            currRow[j] = prevRow[j - 1];
          } else {
            currRow[j] = 1 + Math.min(
              currRow[j - 1], // insert
              prevRow[j], // remove
              prevRow[j - 1] + REPLACEMENT_PENALTY // replace
            );
          }
        }

        prevRow = [...currRow];
      }

      return currRow[n];
    }

    function fuzzySubstringMatch(input, text) {
      const inputLen = input.length;
      const textLen = text.length;
      let minDistance = Infinity;

      for (let i = 0; i <= textLen - inputLen; i++) {
        const substring = text.slice(i, i + inputLen);
        const distance = levenshteinDistance(input, substring);
        minDistance = Math.min(minDistance, distance);
      }

      return minDistance;
    }

    const searchBreeds = (query, breeds) => {
      if (!query) return breeds;
      query = query.trim().toLowerCase().replaceAll(/[-|\s]/g, '');

      const SHORT_INPUT_THRESHOLD = 0;
      const PREFIX_MATCH_SCORE = 100;
      const FUZZY_MATCH_BASE_SCORE = 50;
      const SUBSTRING_MATCH_SCORE = 80;
      const MIN_SCORE = 47;

      const results = [];
      if (query.length <= SHORT_INPUT_THRESHOLD) {
        return breeds.filter(b => {
          const name = (b.breed || '').toLowerCase().replaceAll(/[-|\s]/g, '');
          return name.startsWith(query);
        });
      };

      for (const breedData of breeds) {
        const breedLower = (breedData.breed || '').toLowerCase().replaceAll(/[-|\s]/g, '');
        let score = 0;

        if (breedLower.startsWith(query)) {
          score = PREFIX_MATCH_SCORE;
        } else if (breedLower.includes(query)) {
          score = SUBSTRING_MATCH_SCORE;
        } else {
          const fuzzy_substring_distance = fuzzySubstringMatch(query, breedLower);
          const distance = levenshteinDistance(query, breedLower);
          score = FUZZY_MATCH_BASE_SCORE - Math.min(fuzzy_substring_distance, distance);
        }

        results.push({ ...breedData, score });
      }

      return results
        .filter(data => data.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score);
    };

    const searchInput = document.getElementById('site-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const searchVal = searchInput.value;
        const filteredBreeds = searchBreeds(searchVal, this.breeds);
        this.addBreedsToUI(filteredBreeds);
      });
    }
  };

  const init = async () => {
    this.addButtonFuntionality();
    try {
      const breeds = await this.getBreeds();
      this.breeds = breeds;
      this.addBreedsToUI(this.breeds);

    } catch (error) {
      console.error(error);
    }
  };

  init();

};

const breeds = new BreedList();