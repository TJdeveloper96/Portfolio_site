const productCards = document.querySelectorAll(".item:not(.service-card)");
const cartList = document.querySelector(".cart-list");
const cartEmpty = document.querySelector(".cart-empty");
const cartTotal = document.querySelector(".cart-total");
const cartCounts = document.querySelectorAll(".cart-count");
const cartLinks = document.querySelectorAll(".cart-link");
const cartMessage = document.querySelector(".cart-message");
const cartStorageKey = "wagashiCart";
const pricesStorageKey = "wagashiPrices";

function createRandomPrice() {
  // This creates a random product price between 1.00 and 5.99.
  return Number((Math.random() * 4.99 + 1).toFixed(2));
}

function formatPrice(price) {
  // This turns a number into a euro price, for example 3.5 becomes €3.50.
  return `€${price.toFixed(2)}`;
}

function getCart() {
  // This reads the saved cart from localStorage, so the cart also works on another page.
  const savedCart = localStorage.getItem(cartStorageKey);

  if (savedCart) {
    return JSON.parse(savedCart);
  }

  return [];
}

function getSavedPrices() {
  // This reads saved product prices so random prices stay the same after a page refresh.
  const savedPrices = localStorage.getItem(pricesStorageKey);

  if (savedPrices) {
    return JSON.parse(savedPrices);
  }

  return {};
}

function savePrices(prices) {
  // This saves all product prices by product name.
  localStorage.setItem(pricesStorageKey, JSON.stringify(prices));
}

function saveCart(cart) {
  // This saves the newest cart data in the browser.
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function getCartCount(cart) {
  // This counts all product quantities together for the number next to the cart icon.
  return cart.reduce((total, product) => total + product.quantity, 0);
}

function updateCartCount(cart) {
  // This updates every cart icon number that exists on the current page.
  const count = getCartCount(cart);

  cartCounts.forEach((cartCount) => {
    cartCount.textContent = count;
    cartCount.hidden = count === 0;
  });
}

function animateCartIcon() {
  // This gives visual feedback after adding a product.
  cartLinks.forEach((cartLink) => {
    cartLink.classList.remove("cart-link-added");
    void cartLink.offsetWidth;
    cartLink.classList.add("cart-link-added");
  });
}

function showAddedMessage(productName) {
  // This shows a short message so users know their click did something.
  if (!cartMessage) {
    return;
  }

  cartMessage.textContent = `${productName} is toegevoegd aan je winkelwagen`;
  cartMessage.classList.add("cart-message-visible");

  setTimeout(() => {
    cartMessage.classList.remove("cart-message-visible");
  }, 1400);
}

function updateCartPage(cart) {
  // This only runs on the cart page, because the homepage does not have a cart list anymore.
  if (!cartList || !cartEmpty || !cartTotal) {
    return;
  }

  cartList.innerHTML = "";

  // This calculates the total price by multiplying each product price by its quantity.
  const total = cart.reduce((sum, product) => {
    return sum + product.price * product.quantity;
  }, 0);

  // This shows or hides the empty-cart text depending on the cart content.
  cartEmpty.hidden = cart.length > 0;

  cart.forEach((product) => {
    // This creates one visible cart line per product and shows how many times it was added.
    const cartItem = document.createElement("li");
    cartItem.className = "cart-item";

    const productInfo = document.createElement("span");
    productInfo.className = "cart-product-info";
    productInfo.textContent = product.name;

    const quantity = document.createElement("small");
    quantity.className = "cart-quantity";
    quantity.textContent = `x${product.quantity}`;
    productInfo.appendChild(quantity);

    const productTotal = document.createElement("strong");
    productTotal.textContent = formatPrice(product.price * product.quantity);

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    const decreaseButton = document.createElement("button");
    decreaseButton.className = "cart-control-button";
    decreaseButton.type = "button";
    decreaseButton.textContent = "-";
    decreaseButton.setAttribute("aria-label", `Verwijder een ${product.name}`);
    decreaseButton.addEventListener("click", () => {
      changeProductQuantity(product.name, -1);
    });

    const increaseButton = document.createElement("button");
    increaseButton.className = "cart-control-button";
    increaseButton.type = "button";
    increaseButton.textContent = "+";
    increaseButton.setAttribute("aria-label", `Voeg een ${product.name} toe`);
    increaseButton.addEventListener("click", () => {
      changeProductQuantity(product.name, 1);
    });

    const removeButton = document.createElement("button");
    removeButton.className = "cart-remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Verwijderen";
    removeButton.addEventListener("click", () => {
      removeProductFromCart(product.name);
    });

    controls.appendChild(decreaseButton);
    controls.appendChild(increaseButton);
    controls.appendChild(removeButton);

    cartItem.appendChild(productInfo);
    cartItem.appendChild(productTotal);
    cartItem.appendChild(controls);

    cartList.appendChild(cartItem);
  });

  cartTotal.textContent = `Totaal: ${formatPrice(total)}`;
}

function changeProductQuantity(productName, amount) {
  const cart = getCart();
  const product = cart.find((cartProduct) => cartProduct.name === productName);

  if (!product) {
    return;
  }

  product.quantity += amount;

  const updatedCart = cart.filter((cartProduct) => cartProduct.quantity > 0);

  saveCart(updatedCart);
  updateCartCount(updatedCart);
  updateCartPage(updatedCart);
}

function removeProductFromCart(productName) {
  const cart = getCart();
  const updatedCart = cart.filter((product) => product.name !== productName);

  saveCart(updatedCart);
  updateCartCount(updatedCart);
  updateCartPage(updatedCart);
}

function addProductToCart(productName, price) {
  // This adds one product to the saved cart every time the user clicks.
  const cart = getCart();
  const existingProduct = cart.find((product) => product.name === productName);

  if (existingProduct) {
    // If the product already exists, only the quantity goes up.
    existingProduct.quantity += 1;
  } else {
    // If the product is new, it starts with a quantity of 1.
    cart.push({
      name: productName,
      price: price,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount(cart);
  updateCartPage(cart);
  animateCartIcon();
  showAddedMessage(productName);
}

const productPrices = getSavedPrices();

productCards.forEach((card) => {
  const productName = card.querySelector("h2").textContent;

  if (!productPrices[productName]) {
    productPrices[productName] = createRandomPrice();
    savePrices(productPrices);
  }

  const price = productPrices[productName];

  // This adds the random price to each product card.
  const priceElement = document.createElement("p");
  priceElement.className = "product-price";
  priceElement.textContent = formatPrice(price);

  // This button adds one product to the cart every time it is clicked.
  const button = document.createElement("button");
  button.className = "add-to-cart";
  button.type = "button";
  button.textContent = `In winkelwagen - ${formatPrice(price)}`;

  button.addEventListener("click", () => {
    addProductToCart(productName, price);

    // This makes the clicked button react for a moment.
    button.classList.add("add-to-cart-added");

    setTimeout(() => {
      button.classList.remove("add-to-cart-added");
    }, 450);
  });

  card.appendChild(priceElement);
  card.appendChild(button);
});

const cart = getCart();

updateCartCount(cart);
updateCartPage(cart);
