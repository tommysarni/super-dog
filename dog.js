function Dog(id) {
  this.id = id;
  if (!this.id) {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = urlParams.get('breed');
    this.id = decodeURIComponent(raw);
  }

}

const dog = new Dog();