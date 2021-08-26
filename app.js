const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "wzenxervphqe",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "4J_QEV0g2DvnSUN86zvmIh7QlYR_0VsOdkSQF6KnxVE"
});

// console.log(client);

// variables
const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

// cart
let cart = [];

// buttons
let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      // let contentful = await client.getEntries({
      //   content_type: "comfyHouseProducts"
      // });

      /*** To use the local data use this block instead ***/
      let result = await fetch("products.json");
      let data = await result.json();      
      
      // return data
      let products = data.items;
      /***************************************************/
      
      // let products = contentful.items;

      products = products.map(item => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;

        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display products
class UI {
  displayProducts(products) {
    let result = '';

    products.forEach(product => {
      result += `
        <!-- single product -->
        <article class="product">
          <div class="img-container">
            <img src=${product.image} alt="product" class="product-img">
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
      <!-- end single product --> 
      `;
    });

    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    // turn the bag-btn node list into an array by using [...]
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;

    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);

      if(inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      } 
      
      button.addEventListener("click", event => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;

        // Getting the item from the local storage 
        // And add the 'amount' property and make the data into cartItem object
        let cartItem = {...Storage.getProduct(id), amount:1 };

        // add product to the cart
        cart = [...cart, cartItem];

        // save the cart into the local storage
        Storage.saveCart(cart);

        // set cart values
        this.setCartValues(cart);

        // display cart item
        this.addCartItem(cartItem);

        // show the cart
        this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    })

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <img src=${item.image} alt="product">
          <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
          </div>
          <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
          </div>
    `;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }

  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item =>this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }

  cartLogic() {
    // clearCartBtn.addEventListener("click", this.clearCart());
    // 'this' in this case is a button, not the UI
    //
    // When you need to access the method in the class check which target is the 'this' pointing to
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });      

    // cart functionality
    cartContent.addEventListener("click", event => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;

        // remove item from the cart content
        cartContent.removeChild(removeItem.parentElement.parentElement);

        // remove item from the local storage
        this.removeItem(id);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;

        // update the item amount of the local storage
        Storage.saveCart(cart);

        // update the total price
        this.setCartValues(cart);

        // update the number of amount in the cart - next sibling
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;

        if(tempItem.amount > 0) {
          // update the item amount of the local storage
          Storage.saveCart(cart);

          // update the total price
          this.setCartValues(cart);

          // update the number of amount in the cart - previous sibling
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          // remove the item from the cart content
          cartContent.removeChild(lowerAmount.parentElement.parentElement);

          // remove the item from the local storage
          this.removeItem(id);

        }
      }
    });
  }

  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));   
    console.log(cartContent.children);
    
    // keep removing cart content until there's no more items in cart
    while(cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);

    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `
      <i class="fas fa-shopping-cart"></i>add to cart
    `;
  }

  getSingleButton(id) {
    // find and returns a button with a certain id from the buttonsDOM
    return buttonsDOM.find(button => button.dataset.id === id)
  }
}

// local storage - to speed up bringing data about products
class Storage{
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();

  // setup app
  ui.setupAPP();

  // get all products
  // 1st then : display products on the page & save the product data into the localstorage
  // 2nd then : get buttons of the product images after all the elements are loaded
  products.getProducts().then(products => {
    ui.displayProducts(products);
    Storage.saveProducts(products);
  }).then(() => {
    ui.getBagButtons();
    ui.cartLogic();
  });
});