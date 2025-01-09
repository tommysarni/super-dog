function BreedList() {
  this.filters = {
    group: '',
    height: '',
    weight: '',
    energy: [],
    exercise: [],
    goodWithChildren: [],
    playfullness: [],
    affection: [],
    dogFriendliness: [],
    petFriendliness: [],
    strangerFriendliness: [],
    trainingEase: [],
    watchdog: [],
    protection: [],
    grooming: [],
    coldTolerance: [],
    heatTolerance: [],
  };

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
        const { breed, slug, group } = b || {};
        if (!breed || !slug) return;
        const li = document.createElement('li');
        li.classList.add('breed');
        const a = document.createElement('a');
        a.href = '/dog.html?breed=' + slug;
        const p_breed = document.createElement('p');
        p_breed.textContent = decodeURIComponent(breed);
        const p_group = document.createElement('p');
        p_group.classList.add('group');
        p_group.textContent = group;
        a.appendChild(p_breed);
        a.appendChild(p_group);
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
      searchInput.value = '';
      searchInput.addEventListener('input', () => {
        const searchVal = searchInput.value;
        const filteredBreeds = searchBreeds(searchVal, this.breeds);
        this.addBreedsToUI(filteredBreeds);
      });
    }

    const expandBtn = document.querySelector('button.expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const filtersEl = document.querySelector('div.filters');
        if (filtersEl) {
          filtersEl.classList.toggle('expanded');
        }
      });
    }

    const updateStatFilter = (type, num) => {
      let selectedFilter = this.filters[type];

      if (selectedFilter !== undefined) {
        if (selectedFilter.length === 1) {
          if (selectedFilter[0] === num) {
            this.filters[type] = [];
            return this.filters[type];
          } else if (selectedFilter[0] < num) {
            this.filters[type] = [...selectedFilter, num];
            return this.filters[type];
          }
        }
        this.filters[type] = [num];
      }
      return this.filters[type];
    };

    const updateStatUI = (btns, indices) => {
      let [start, end] = indices;
      if (end === undefined) end = start;
      btns.forEach((b, idx) => {
        if (idx + 1 >= start && idx + 1 <= end) {
          b.classList.toggle('selected', true);
        } else b.classList.toggle('selected', false);
      });
    };

    const stats = document.querySelectorAll('.stat');
    stats.forEach(s => {
      const btns = document.querySelectorAll(`#${s.id}>button`);
      btns.forEach((b, idx) => {
        b.addEventListener('click', () => {
          const updatedFilters = updateStatFilter(s.id, idx + 1);
          updateStatUI(btns, updatedFilters);
        });
      });
    });

    const setSelectedInput = (type) => (e) => {
      const selected = this.filters[type];
      if (selected !== undefined) {
        const value = e.target.value;
        this.filters[type] = value;
      }
    };

    const groupSelect = document.getElementById('group-select');
    if (groupSelect) {
      groupSelect.value = '';
      groupSelect.addEventListener('change', setSelectedInput('group'));
    }
    const heightSelect = document.getElementById('height-select');
    if (heightSelect) {
      heightSelect.value = '';
      heightSelect.addEventListener('change', setSelectedInput('height'));
    }
    const weightSelect = document.getElementById('weight-select');
    if (weightSelect) {
      weightSelect.value = '';
      weightSelect.addEventListener('change', setSelectedInput('weight'));
    }

    const prepFilterOptions = () => {
      let results = {};

      for (let [key, val] of Object.entries(this.filters)) {
        if (key === 'group' || key === 'height' || key === 'weight') {
          if (val !== '') results[key] = val;
        } else {
          if (val.length) {
            results[key] = val.join('-');
          }
        }
      }

      return results;
    };
    const applyFilterBtn = document.querySelector('button.apply');
    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', (e) => {
        console.log(prepFilterOptions());
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