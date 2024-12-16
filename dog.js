function Dog(id) {
  this.id = id;
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
      titleEl.textContent = data.breed || '';
      document.title = data.breed || 'Super Dog';
    }

    // IMAGE
    const imgEl = document.querySelector('.imageContainer img');
    if (imgEl) {
      imgEl.src = `https://doggo-api-super-dog-bucket.s3.us-east-1.amazonaws.com/${this.id}.jpg`;
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
    const URL = `https://doggo-api-super-dog-bucket.s3.us-east-1.amazonaws.com/${this.id}.jpg`;
    try {
      const response = await fetch(URL, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          Origin: window.location.origin,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error while fetching image metadata! Status: ${response.status}`);
      }

      const pos = response.headers.get('x-amz-meta-pos');
      const author = decodeURIComponent(response.headers.get('x-amz-meta-author') || '');
      const ccLink = response.headers.get('x-amz-meta-ccLink');
      const loc = response.headers.get('x-amz-meta-loc');

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

    } catch (error) {
      console.error('Error fetching image metadata:', error);
    }

  };

  this.removeLoaders = () => {
    const loaders = document.querySelectorAll('.loading');
    loaders.forEach(el => {
      el.classList.remove('loading');
    });
  };

  const init = async () => {
    if (this.id) {
      const breedData = await this.getBreedData();
      if (breedData.error) {
        this.removeLoaders();
        throw new Error('Error Retrieving Data, Reason: ' + breedData.error);
      }
      this.hydrateData(breedData);
      this.updateImagePosition();
      this.removeLoaders();
    }
  };

  init();

}

const dog = new Dog();