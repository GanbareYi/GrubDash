const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// Validation: If a property is missing or empty, respond with a status code
// of 400 and an error message.
function bodyDataHas(propertyName) {
    return function(req, res, next) {
        const { data } = req.body;

        if (data[propertyName]){
            return next();
        }

        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    }
}

// If price property is 0 or less or not an integer, respond with a status code
// of 400 and an error message.
function priceIsValidNumber(req, res, next){
    const {data: { price } = {}} = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
    }

    next();
}

function create(req, res) {
    const {data: {name, description, price, image_url} = {}} = req.body;

    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url
    }

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

// Check whether a given dish id exists.
function dishExists(req, res, next) {
    const { dishId } = req.params;

    const foundDish = dishes.find(dish => dish.id === dishId);

    if (foundDish){
        res.locals.dish = foundDish;
        return next();
    }

    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
}

function read(req, res) {
    res.status(200).json({ data: res.locals.dish});
}

function dishIdMatches(req, res, next) {
    const { dishId } = req.params;
    const { id } = res.locals.dish;

    if (id === dishId){
        return next();
    }

    next({
        status: 404,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
}

function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    // Update the dish
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

function list(req, res) {
    res.json({data: dishes});
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber, 
        create],
    read: [dishExists, read],
    update: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber, 
        dishIdMatches,
        dishExists,
        update
    ],
    list,
}
