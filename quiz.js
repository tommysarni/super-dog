const LOW = '1-2';
const MODERATE = '2-4';
const HIGH = '4-5';
const QUIZ = {
  texture: {
    sleek: {
      energy: MODERATE,
      grooming: LOW,
      coolness: HIGH,
      beauty: HIGH,
    },
    fluffy: {
      affection: HIGH,
      grooming: '3+',
      cuteness: HIGH,
      goodWithChildren: HIGH,
      beauty: MODERATE,
    },
    course: {
      toughness: HIGH,
      protection: '3+',
      coolness: HIGH,
      goodWithChildren: '-3',
      beauty: '-3',
    },
  },
  architecture: {
    minimalist: {
      grooming: LOW,
      affection: '-3',
      strangerFriendliness: '-3',
      playfullness: '-3',
    },
    modern: {
      cleverness: HIGH,
      energy: '3+',
      trainingEase: '3+',
    },
    traditional: {
      protection: '3+',
      affection: MODERATE,
      toughness: HIGH,
      exercise: '3+',
    },
  },
  season: {
    summer: {
      heatTolerance: '3+',
      energy: HIGH,
      playfullness: HIGH,
      toughness: '-3',
    },
    autumn: {
      coldTolerance: '3+',
      heatTolerance: '3+',
      energy: MODERATE,
      playfullness: MODERATE,
      affection: HIGH,
      toughness: MODERATE,
    },
    winter: {
      coldTolerance: HIGH,
      affection: HIGH,
      playfullness: MODERATE,
      energy: '-3',
      toughness: '3+',
    },
  },
  artwork: {
    abstract: {
      trainingEase: HIGH,
      cleverness: HIGH,
      energy: MODERATE,
      exercise: '-3',
      coolness: '3+',
    },
    classic: {
      affection: HIGH,
      beauty: HIGH,
      grooming: '3+',
      trainingEase: '-3',
    },
    nature: {
      energy: HIGH,
      cleverness: HIGH,
      exercise: HIGH,
      trainingEase: MODERATE,
    },
  },
  swatches: {
    vivid: {
      energy: HIGH,
      playfullness: HIGH,
      dogFriendliness: '3+',
      strangerFriendliness: '3+',
    },
    pastel: {
      affection: HIGH,
      energy: LOW,
      playfullness: '-3',
      coolness: '-3',
      goodWithChildren: HIGH,
      trainingEase: '3+',
    },
    earthy: {
      toughness: HIGH,
      coolness: HIGH,
      affection: MODERATE,
      goodWithChildren: MODERATE,
      trainingEase: MODERATE,
    },
  },
  fashion: {
    trendy: {
      energy: HIGH,
      playfullness: HIGH,
      beauty: HIGH,
    },
    timeless: {
      affection: HIGH,
      energy: MODERATE,
      grooming: MODERATE,
      trainingEase: '3+',
    },
    sporty: {
      exercise: HIGH,
      toughness: HIGH,
      coolness: HIGH,
      trainingEase: HIGH,
    },
  },
  ambiance: {
    bright: {
      energy: HIGH,
      playfullness: MODERATE,
      cleverness: HIGH,
      heatTolerance: '3+',
      strangerFriendliness: HIGH,
    },
    cozy: {
      energy: LOW,
      affection: HIGH,
      playfullness: LOW,
      strangerFriendliness: LOW,
      cleverness: '-3',
    },
    dark: {
      coolness: HIGH,
      toughness: HIGH,
      beauty: HIGH,
      playfullness: LOW,
    },
  },
  era: {
    vintage: {
      protection: HIGH,
      energy: MODERATE,
      affection: '-3',
      watchdog: HIGH,
      toughness: '3+',
      strangerFriendliness: LOW,
    },
    neutral: {
      protection: '-3',
      strangerFriendliness: HIGH,
      dogFriendliness: HIGH,
      affection: HIGH,
      playfullness: HIGH,
      energy: MODERATE,
    },
    sports: {
      affection: MODERATE,
      cleverness: HIGH,
      energy: HIGH,
      trainingEase: HIGH,
    },
  },
};

const quizDict = {
  "vibe-check": QUIZ
}



function Quiz(quiz, el) {
  this.categories = quiz
  this.element = el;
  this.answers = {};
  this.catIndex = 0;
  this.imageCache = {}

  this.getCategories = () => {
    return Object.keys(this.categories)
  }

  this.getOptions = (category) => {
    if (!category) return category;
    return Object.keys(this.categories[category])
  }

  const prefetchImages = async () => {

    const categories = this.getCategories()
    const options = categories.map((category) => this.getOptions(category)).flat();

    const promises = options.map((option) => {
      const url = `https://doggo-api-super-quiz.s3.us-east-1.amazonaws.com/${option}.jpg`;
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          this.imageCache[url] = img;
          resolve(url);
        }
        img.onerror = () => reject(`Failed to load: ${url}`);
      });
    });


    try {
      const loadedImages = await Promise.all(promises);
    } catch (error) {
      console.error(error);
    }
  }

  const setAnswer = (idx) => {
    const categories = this.getCategories()
    const type = categories[this.catIndex];
    const options = this.getOptions(type)
    if (options !== undefined) {

      this.answers[type] = options[idx]
    }
  }

  const addQuizButtonsFunctionality = () => {
    const gameEl = this.element.querySelector('.game');
    const buttons = gameEl.querySelectorAll('button');
    buttons.forEach((button, idx) => {
      button.addEventListener('click', (e) => {
        if (e.target.classList.contains('foreground')) {
          setAnswer(idx);
          this.next();
        }
      });
    })
  }

  const setImage = async (el, type) => {
    const url = `https://doggo-api-super-quiz.s3.us-east-1.amazonaws.com/${type}.jpg`;

    return new Promise((resolve, reject) => {
      if (this.imageCache[url]) {
        el.src = this.imageCache[url].src;
        el.alt = type;
        el.onload = () => resolve(`Image loaded from cache: ${url}`);
        el.onerror = () => reject(`Failed to load cached image: ${url}`);
      } else {
        el.src = url;
        el.alt = type;
        el.onload = () => {
          resolve(`Image successfully loaded: ${url}`);
        };
        el.onerror = () => {
          reject(`Failed to load image: ${url}`);
        };
      }
    });
  };




  const updateQuizImages = () => {
    const foregroundImageElements = this.element.querySelectorAll('.foreground');
    const backgroundImageElements = this.element.querySelectorAll('.background');

    const categories = this.getCategories()
    const foregroundCategory = categories[this.catIndex]
    const foregroundOptions = this.getOptions(foregroundCategory)
    if (!foregroundOptions?.length) return;
    try {
      foregroundImageElements.forEach(async (foregroundImageEl, idx) => {

        const foregroundType = foregroundOptions[idx];
        await setImage(foregroundImageEl, foregroundType);
      })
    } catch (error) {
      console.error('Error loading foreground image:', error);
    }

    const backgroundCategory = categories[this.catIndex + 1]
    if (!backgroundCategory) return;
    const backgroundOptions = this.getOptions(backgroundCategory)

    backgroundImageElements.forEach(async (backgroundImageEl, idx) => {
      const backgroundType = backgroundOptions[idx]
      setImage(backgroundImageEl, backgroundType)
        .catch((error) => {
          console.error('Error loading background image:', error);
        });
    })

  };


  this.start = () => {
    const gameBlockEl = this.element.querySelector('.gameBlock')
    if (gameBlockEl) {
      gameBlockEl.style.display = 'block'
    }
    addQuizButtonsFunctionality()
    updateQuizImages()
  }

  this.next = () => {
    this.catIndex++;
    const maxCategories = this.getCategories().length
    if (this.catIndex < maxCategories) {

      updateQuizImages();
    } else this.end();
  }

  const createStatUI = (stat) => {
    const [, data] = stat;
    const { text, rank, breedVal } = data;
    const statDiv = document.createElement('div')
    statDiv.classList.add('stat')
    statDiv.innerHTML = `
          <div class="statText">
            <h4>${text}</h4>
            <h3>${rank}</h3>
          </div>

          <p class="rating">${breedVal.toFixed(1)}</p>

    `.trim()
    return statDiv
  }

  const createOthersUI = (breedData) => {
    const { breed, slug } = breedData;
    const otherDiv = document.createElement('div')
    otherDiv.classList.add('other');
    otherDiv.innerHTML = `
           <a href="/dog.html?breed=${slug}">
              <p>${breed}</p>
              <div class="">
                <img src="https://doggo-api-super-dog-bucket.s3.us-east-1.amazonaws.com/${slug}.jpg" alt="${breed}">
              </div>
            </a>
            `.trim()
    return otherDiv
  }


  const updateResultUI = () => {
    const resultsBlockEl = this.element.querySelector('.resultsBlock')
    if (resultsBlockEl) {
      resultsBlockEl.style.display = 'block'
    }
    const [selected] = this.data.scores || [];
    const { analysis } = this.data

    if (!selected) return;
    const breedEl = this.element.querySelector('.resultsBlock .breed');
    if (breedEl) {
      breedEl.textContent = selected.breed;
    }

    const chosenEl = this.element.querySelector('a.chosen');
    if (chosenEl) {
      chosenEl.href = `/dog.html?breed=${selected.slug}`
    }

    const imgEl = this.element.querySelector('.chosen>img');
    if (imgEl) {
      imgEl.src = `https://doggo-api-super-dog-bucket.s3.us-east-1.amazonaws.com/${selected.slug}.jpg`
      imgEl.alt = selected.breed
    }

    const analyticsEl = this.element.querySelector('.analytics');
    if (analyticsEl) {
      analyticsEl.replaceChildren();
      analyticsEl.style.gridTemplateColumns = '1fr 1fr 1fr'
      analysis.forEach(stat => {
        const uiEl = createStatUI(stat);
        analyticsEl.appendChild(uiEl)
      })
    }

    const matchEl = this.element.querySelector('.match')
    if (matchEl) {
      const scaleEl = document.createElement('p');
      scaleEl.classList.add('addendum')
      scaleEl.textContent = '* based on a scale 1 to 5';
      matchEl.appendChild(scaleEl)
    }

    const othersEl = this.element.querySelector('.others')
    if (othersEl) {
      othersEl.replaceChildren();
      const othersTitle = document.createElement('h2');
      othersTitle.textContent = 'Other Matches';
      othersEl.appendChild(othersTitle)
      const otherBreeds = this.data.scores.slice(1);
      otherBreeds.forEach(b => {
        const breedElement = createOthersUI(b);
        othersEl.appendChild(breedElement)
      })
    }
  }

  this.updateLoaders = (force = true) => {
    const loadingBlock = this.element.querySelector('.loadingBlock')
    if (loadingBlock) {
      loadingBlock.style.display = force ? 'block' : 'none'
    }

    const gameEl = this.element.querySelector('.game')
    if (gameEl) {
      gameEl.style.opacity = '50%'
    }
  }

  this.end = async () => {
    this.updateLoaders()
    const data = await makeQuizAPICall()
    this.updateLoaders(false)
    this.data = data;
    const gameBlockEl = this.element.querySelector('.gameBlock')
    if (gameBlockEl) {
      gameBlockEl.style.display = 'none'
    }

    updateResultUI()
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

  this.prepQuizBody = () => {
    const body = {}
    body.quiz = this.categories;
    body.quizAnswers = this.answers;
    return body
  }

  const makeQuizAPICall = async () => {
    const quizBody = this.prepQuizBody();

    const token = await this.getToken();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${token}`);

    const body = JSON.stringify({
      path: 'v1/quiz',
      method: "POST",
      ...quizBody
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

      return json;
    } catch (error) {
      console.error(error);
    }
  }


  const init = async () => {
    await prefetchImages(this.categories)
    this.start();
  }

  init()

}



function Selection() {

  this.addButtonFunctionality = () => {
    const quizzes = document.querySelectorAll('.quiz');
    quizzes.forEach(quiz => {
      const button = quiz.querySelector('button');
      const startEl = quiz.querySelector('.start');
      button.addEventListener('click', async (e) => {
        const q = new Quiz(quizDict[quiz.id], quiz);
        startEl.style.display = 'none';
      });
    });

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
  }


  const init = () => {
    this.addButtonFunctionality()
  }

  init()

}

const selection = new Selection()