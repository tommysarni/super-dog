function FAQ() {

  this.addButtonFunctionality = () => {
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
    this.addButtonFunctionality();
  }

  init();

}

const faq = new FAQ()