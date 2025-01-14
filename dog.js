function Dog(id) {
  this.id = id;
  this.unitType = 'US'; // US or METRIC
  this.loaded = false;

  if (!this.id) {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = urlParams.get('breed');
    if (raw) this.id = decodeURIComponent(raw);
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

  this.hydrateData = (data) => {

    // TITLE
    const titleEl = document.querySelector('h1');
    if (titleEl) {
      const decodedTitle = decodeURIComponent(data.breed || '');
      titleEl.textContent = decodedTitle;
      document.title = decodedTitle || 'Super Dog';
    }

    // IMAGE
    const imgEl = document.querySelector('.imageContainer img');
    if (imgEl) {
      imgEl.src = `https://d138t63mg6zpwf.cloudfront.net/doggo-api-super-dog-bucket/${this.id}.jpg`;
      imgEl.alt = data.breed;
    }

    // SCROLLING TEXT
    const makeScrollingList = (location, words) => {
      if (location && words.length) {
        const evenWordLength = words.length % 2 === 0;
        location.replaceChildren();
        let front = document.createElement('ul');
        front.classList.add('scrollingText', 'front', 'odd');
        let back = document.createElement('ul');
        back.classList.add('scrollingText', 'back', evenWordLength ? 'even' : 'odd');
        let extra = document.createElement('ul');
        extra.classList.add('scrollingText', 'extra', evenWordLength ? 'even' : 'odd');

        [front, back, extra].forEach(ul => {
          words.forEach(w => {
            let li = document.createElement('li');
            li.textContent = w;
            ul.appendChild(li);
          });
        });

        location.appendChild(front);
        location.appendChild(back);
        location.appendChild(extra);
      }
    };

    const scrollingListEl = document.querySelector('.scrollingTextContainer');
    if (data.temperament) {
      const words = data.temperament.split('|').filter(s => s).map(s => s.replace('-', ' '));
      makeScrollingList(scrollingListEl, words);
    }

    // INFO TABLE
    const groupEl = document.getElementById('group');
    if (groupEl) groupEl.textContent = data.group;
    const originEl = document.getElementById('origin');
    if (originEl) originEl.textContent = data.origin;
    const originDateEl = document.getElementById('dateOfOrigin');
    if (originDateEl) originDateEl.textContent = data.originDate;
    const lifespanEl = document.getElementById('lifespan');
    if (lifespanEl) lifespanEl.textContent = data.lifespan;

    // WEIGHT TABLE
    const maleHeightEl = document.getElementById('maleHeight');
    if (maleHeightEl) maleHeightEl.textContent = data.maleHeightInInches;
    const femaleHeightEl = document.getElementById('femaleHeight');
    if (femaleHeightEl) femaleHeightEl.textContent = data.femaleHeightInInches;
    const maleWeightEl = document.getElementById('maleWeight');
    if (maleWeightEl) maleWeightEl.textContent = data.maleWeightInLbs;
    const femaleWeightEl = document.getElementById('femaleWeight');
    if (femaleWeightEl) femaleWeightEl.textContent = data.femaleWeightInLbs;

    const createAndAddProgress = (locationEl, val) => {
      if (!locationEl || val === undefined) return;
      locationEl.replaceChildren();
      locationEl.setAttribute('aria-valuenow', val);

      for (let i = 0; i < 5; i++) {
        const progress = document.createElement('div');
        progress.classList.add('progress-segment');

        const segmentValue = document.createElement('div');
        segmentValue.classList.add('segment-value');

        const decimalVal = val - 1 < 0 ? val.toFixed(1) : 1;

        segmentValue.style.width = decimalVal * 100 + '%';
        progress.appendChild(segmentValue);
        val -= decimalVal;
        locationEl.appendChild(progress);
      }
    };

    const progressIds = ['goodWithChildren', 'energy', 'exercise', 'playfullness', 'affection', 'dogFriendliness', 'petFriendliness', 'strangerFriendliness', 'trainingEase', 'watchdog', 'protection', 'grooming', 'coldTolerance', 'heatTolerance'];

    progressIds.forEach(id => {
      const el = document.getElementById(id);
      const val = data[id];
      if (el && val !== undefined) createAndAddProgress(el, val);
    });

  };

  this.updateImagePosition = async () => {
    const cachedData = sessionStorage.getItem(this.id);
    const json = JSON.parse(cachedData || '{}');
    let pos, author, ccLink, loc;

    if (cachedData && json.pos) {
      pos = json.pos;
      author = json.author;
      ccLink = json.ccLink;
      loc = json.loc;
    } else {
      const URL = `https://d138t63mg6zpwf.cloudfront.net/doggo-api-super-dog-bucket/${this.id}.jpg`;
      try {
        const response = await fetch(URL, {
          method: 'HEAD',
          mode: 'cors',
          headers: {
            Origin: window.location.origin,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error while fetching image metadata! Status: ${response.status}`);
        }

        pos = response.headers.get('x-amz-meta-pos');
        author = decodeURIComponent(response.headers.get('x-amz-meta-author') || '');
        ccLink = response.headers.get('x-amz-meta-ccLink');
        loc = response.headers.get('x-amz-meta-loc');

        sessionStorage.setItem(this.id, JSON.stringify({ ...(json || {}), pos, author, ccLink, loc }));

      } catch (error) {
        console.error('Error fetching image metadata:', error);
      }
    }

    const imgEl = document.querySelector('.imageContainer img');
    if (imgEl && pos !== undefined) {
      imgEl.style.objectPosition = pos;
    }

    if (author || ccLink || loc) {
      const authorEl = document.getElementById('author');
      if (author && authorEl) authorEl.textContent = author;
      const ccLinkEl = document.getElementById('ccLink');
      if (ccLink && ccLinkEl) ccLinkEl.href = ccLink;
      const locEl = document.getElementById('loc');
      if (loc && locEl) locEl.href = loc;
      const attributionEl = document.querySelector('.attributionContainer');
      if (attributionEl) attributionEl.style.display = 'flex';
    }
  };

  this.removeLoaders = () => {
    const loaders = document.querySelectorAll('.loading');
    loaders.forEach(el => {
      el.classList.remove('loading');
    });
  };

  this.showErrorPage = (error) => {

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.replaceChildren();
      mainEl.classList.add('errorPage');

      const container = document.createElement('div');
      container.classList.add('errorContainer');

      const errorMessageEl = document.createElement('h1');
      errorMessageEl.textContent = `Error: ${error}`;

      const errorDescriptionEl = document.createElement('p');
      errorDescriptionEl.classList.add('errorMessage');

      errorDescriptionEl.innerHTML = (this.id === undefined) ? `Oops you forgot to select a breed!` : `Unable to find breed with name: <i class="textEmphasize">${this.id}</i>`;

      const linkOptionEl = document.createElement('p');
      linkOptionEl.classList.add('optionMessage');
      linkOptionEl.innerHTML = `Take a look at the <a class="textEmphasize" href="">list of breeds</a> here!`;

      container.appendChild(errorMessageEl);
      container.appendChild(errorDescriptionEl);
      container.appendChild(linkOptionEl);

      const spacer = document.createElement('div');
      spacer.classList.add('spacer');
      mainEl.appendChild(spacer.cloneNode());
      mainEl.appendChild(container);
      mainEl.appendChild(spacer.cloneNode());
    }
  };

  this.onUnitButtonPress = (e) => {
    if (this.loaded && this.data) {
      if (e.target) {
        e.target.textContent = this.unitType === 'METRIC' ? 'Metric' : 'US';
      }
      this.unitType = this.unitType === 'US' ? 'METRIC' : 'US';
      const record = {
        US: {
          heightUnit: 'in',
          weightUnit: 'lbs',
          maleHeight: this.data.maleHeightInInches,
          femaleHeight: this.data.femaleHeightInInches,
          maleWeight: this.data.maleWeightInLbs,
          femaleWeight: this.data.femaleWeightInLbs,
        },
        METRIC: {
          heightUnit: 'cm',
          weightUnit: 'kgs',
          maleHeight: this.data.maleHeightInCm,
          femaleHeight: this.data.femaleHeightInCm,
          maleWeight: this.data.maleWeightInKgs,
          femaleWeight: this.data.femaleWeightInKgs,
        }
      }[this.unitType];

      const m_height_el = document.getElementById('maleHeight');
      if (m_height_el) {
        m_height_el.textContent = record.maleHeight;
      }
      const f_height_el = document.getElementById('femaleHeight');
      if (f_height_el) {
        f_height_el.textContent = record.femaleHeight;
      }
      const m_weight_el = document.getElementById('maleWeight');
      if (m_weight_el) {
        m_weight_el.textContent = record.maleWeight;
      }
      const f_weight_el = document.getElementById('femaleWeight');
      if (f_weight_el) {
        f_weight_el.textContent = record.femaleWeight;
      }
      const height_label_el = document.getElementById('heightUnit');
      if (height_label_el) {
        height_label_el.textContent = record.heightUnit;
      }
      const weight_label_el = document.getElementById('weightUnit');
      if (weight_label_el) {
        weight_label_el.textContent = record.weightUnit;
      }
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

    const unitsBtn = document.querySelector('button.units');
    if (unitsBtn) {
      unitsBtn.addEventListener('click', (e) => {
        this.onUnitButtonPress(e);
      });
    }
  };

  const init = async () => {
    this.addButtonFuntionality();
    if (this.id) {
      const breedData = await this.getBreedData();
      if (breedData.error) {
        this.removeLoaders();
        this.showErrorPage(breedData.error);
        this.loaded = true;
        throw new Error('Error Retrieving Data, Reason: ' + breedData.error);
      }
      this.data = breedData;
      this.hydrateData(breedData);
      this.updateImagePosition();
      this.removeLoaders();
    } else {
      const err = { error: 'No Breed Provided', status: 404 };
      this.removeLoaders();
      this.showErrorPage(err.error);
      this.loaded = true;
      throw new Error('Error Retrieving Data, Reason: ' + err.error);
    }
    this.loaded = true;
  };

  init();

}

const dog = new Dog();