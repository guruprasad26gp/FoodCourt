// Reference to the Firebase database
const database = firebase.database();

// Function to render the food items on the page
function renderFoodItems() {
    // Clear existing list items
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    // Reference to the 'foodItems' node in Firebase
    const foodItemsRef = database.ref('foodItems2');

    // Fetch data from Firebase
    foodItemsRef.once('value', (snapshot) => {
        snapshot.forEach((categorySnapshot) => {
            const category = categorySnapshot.key;

            const categoryHeader = document.createElement('h2');
            categoryHeader.textContent = category;
            menuContainer.appendChild(categoryHeader);

            const categoryListElement = document.createElement('ul');
            categoryListElement.id = `${category.toLowerCase()}-list`;
            menuContainer.appendChild(categoryListElement);

            categorySnapshot.forEach((itemSnapshot) => {
                const foodItem = itemSnapshot.val();

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    ${foodItem.foodName}
                    <div class="quantity">
                        <input type="number" id="${itemSnapshot.key}-quantity" value="${foodItem.quantity}" onchange="updateQuantity('${category}', '${itemSnapshot.key}', this.value)">
                    </div>
                `;

                categoryListElement.appendChild(listItem);
            });
        });
    });
}

// Function to update quantity for a specific item
function updateQuantity(category, itemId, newQuantity) {
    const foodItemRef = database.ref(`foodItems2/${category}/${itemId}`);
    foodItemRef.update({ quantity: parseInt(newQuantity) });
}

// Function to reset form fields
function resetFormFields() {
    document.getElementById('dish-name').value = '';
    document.getElementById('dish-price').value = '';
    document.getElementById('dish-quantity').value = '';
    document.getElementById('dish-category').value = ''; // Reset dropdown
    document.getElementById('dish-vegnonveg').value = '';
    customCategoryInput.style.display = 'none';
    customCategoryInput.querySelector('input').required = false;
}

// Function to save a new dish item to the database
function saveDishToDatabase(newDish) {
    const foodItemsRef = database.ref(`foodItems2/${newDish.FoodType}`);
    foodItemsRef.push(newDish);
    refreshPage();

    // After successfully adding the item to the database, reset form fields
    resetFormFields();

    // Render the updated food items
    renderFoodItems();
}

// Function to populate dropdown with categories from the database
function populateCategoryDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';

    // Fetch categories from the 'foodItems' node in Firebase
    const foodItemsRef = database.ref('foodItems2');

    foodItemsRef.once('value', (snapshot) => {
        snapshot.forEach((categorySnapshot) => {
            const categoryName = categorySnapshot.key;
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            dropdown.appendChild(option);
        });

        // Add the "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'Other';
        otherOption.textContent = 'Other';
        dropdown.appendChild(otherOption);
    });
}


// Event listener for remove type selection
const removeTypeDropdown = document.getElementById('remove-type');
removeTypeDropdown.addEventListener('change', () => {
    const selectedOption = removeTypeDropdown.value;
    const removeItemSection = document.getElementById('remove-item-section');
    const removeCategorySection = document.getElementById('remove-category-section');

    if (selectedOption === 'remove-item') {
        removeItemSection.style.display = 'block';
        removeCategorySection.style.display = 'none';
        populateCategoryDropdown('remove-item-category'); // Populate with all categories
        // Clear and disable the item dropdown until a category is selected
        const itemDropdown = document.getElementById('remove-item-name');
        itemDropdown.innerHTML = '';
        itemDropdown.disabled = true;
    } else if (selectedOption === 'remove-category') {
        removeCategorySection.style.display = 'block';
        removeItemSection.style.display = 'none';
        populateCategoryDropdown('remove-category-name'); // Populate with all categories
    }
});

// Event listener for category change in remove item section
const removeItemCategoryDropdown = document.getElementById('remove-item-category');
removeItemCategoryDropdown.addEventListener('change', () => {
    const selectedCategory = removeItemCategoryDropdown.value;
    const itemDropdown = document.getElementById('remove-item-name');
    itemDropdown.innerHTML = '';
    itemDropdown.disabled = false;

    // Fetch items for the selected category from the database
    const itemsRef = database.ref(`foodItems2/${selectedCategory}`);
    itemsRef.once('value', (snapshot) => {
        snapshot.forEach((itemSnapshot) => {
            const itemName = itemSnapshot.child('foodName').val(); // Get the 'name' property
            const option = document.createElement('option');
            option.value = itemName;
            option.textContent = itemName;
            itemDropdown.appendChild(option);
        });
    });
});

// Event listener for remove button click
const removeButton = document.getElementById('remove-button');
removeButton.addEventListener('click', () => {
    const selectedOption = removeTypeDropdown.value;

    if (selectedOption === 'remove-item') {
        const selectedCategory = removeItemCategoryDropdown.value;
        const selectedItem = document.getElementById('remove-item-name').value;

        console.log('Removing item:', selectedItem);

        const itemRef = database.ref(`foodItems2/${selectedCategory}`);
        // Assuming 'itemname' is the key you want to match
        itemRef.orderByChild('foodName').equalTo(selectedItem).once('value')
            .then(snapshot => {
                snapshot.forEach(childSnapshot => {
                    // Remove the item with the specified itemname
                    childSnapshot.ref.remove().then(() => {
                        alert('Item removed successfully');
                        // Refresh the page if needed
                        location.reload();
                    }).catch(error => {
                        console.error('Error removing item:', error);
                    });
                });
            })
            .catch(error => {
                console.error('Error querying database:', error);
            });

    } else if (selectedOption === 'remove-category') {
        const selectedCategory = document.getElementById('remove-category-name').value;

        console.log('Removing category:', selectedCategory);

        // Remove the selected category from Firebase here
        const categoryRef = database.ref(`foodItems2/${selectedCategory}`);
        categoryRef.remove().then(() => {
            console.log('Category removed successfully');
            // Refresh the page
            location.reload();
        }).catch(error => {
            console.error('Error removing category:', error);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const addDishForm = document.getElementById('add-dish-form');
    const customCategoryInput = document.getElementById('custom-category-input');

    const dishCategoryDropdown = document.getElementById('dish-category');
    dishCategoryDropdown.addEventListener('change', function () {
        if (dishCategoryDropdown.value === 'Other') {
            customCategoryInput.style.display = 'block';
            customCategoryInput.querySelector('input').required = true;
        } else {
            customCategoryInput.style.display = 'none';
            customCategoryInput.querySelector('input').required = false;
        }
    });

    const saveDishButton = document.getElementById('save-dish-button');
    saveDishButton.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent form submission (page refresh)

        const dishName = document.getElementById('dish-name').value;
        const dishPrice = document.getElementById('dish-price').value;
        const dishQuantity = document.getElementById('dish-quantity').value;
        const dishCategory = dishCategoryDropdown.value;
        const dishvegnonveg = document.getElementById('dish-vegnonveg').value;
        const customCategory = customCategoryInput.querySelector('input').value;

        // Create a new dish object with the entered details
        const newDish = {
            cost: parseInt(dishPrice),
            foodName: dishName,
            vegNonVeg: dishvegnonveg,
            quantity: parseInt(dishQuantity),
        };

        // Check if a custom category is entered
        if (dishCategory === 'Other' && customCategory.trim() !== '') {
            // Use the custom category
            newDish.FoodType = customCategory.trim();
        } else {
            newDish.FoodType = dishCategory;
        }

        // Push the new dish data to the Firebase database under the respective category
        saveDishToDatabase(newDish);
    });
});

function refreshPage() {
    location.reload();
}

// Call the function to render food items when the page loads
window.onload = () => {
    renderFoodItems();
    populateCategoryDropdown('dish-category');
};

// Reset Token

document.getElementById("reset_token").addEventListener("click", function () {
    let tokenref = firebase.database().ref("Token");
    try {
        tokenref.set({
            token: 1,
        });
        console.log("Reset Successful")
    } catch (error) {
        console.error("Reset Unsucessfull!" + error)
    }


});
