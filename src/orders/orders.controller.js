const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyDataHas(propertyName){
    return function(req, res, next) {
        const { data } = req.body;

        if (data[propertyName]){
            return next();
        }

        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    }
}

function hasOneOrMoreDish(req, res, next) {
    const { data: { dishes } = {}} = req.body;

    if (Array.isArray(dishes) && dishes.length() >= 1){
        return next();
    } 

    next({
        status: 400,
        message: "Order must include at least one dish."
    })
}

function quantityIsValidNumber(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    dishes.forEach(dish => {
        const quantity = dish.quantity;
        if (!quantity || quantity <=0 || !Number.isInteger(quantity)){
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
    });

    next();
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    const newOrder = {
        id: nextId,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;

    const foundOrder = orders.find(order => order.id === Number(orderId));
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }

    next({
        status: 404,
        message: `Order does not exist: ${orderId}`
    });
}

function read(req, res) {
    res.status(200).json({ data: res.locals.order });
}

function orderIdMatches(req, res, next) {
    const { orderId } = req.params;
    const { id } = res.locals.order;

    if (id === Number(orderId)) {
        return next();
    }

    next({
        status: 404,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
}

function statusPropertyIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    const currentStatus = res.locals.order.status;

    if (req.method === "destroy" && currentStatus !== "pending") {
        return next({
            status: 400, 
            message: "An order cannot be deleted unless it is pending."
        })
    }

    if (currentStatus === "delivered") {
        return next({
            status: 404,
            message: "A delivered order cannot be changed"
        })
    }

    if (!status) {
        return next({
            status: 404,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    }

    next();
}

function update(req, res) {
    const order = res.locals.order;
    const { data: {deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order});
}

function destroy(req, res, next) {
    const { orderId } = req.params;

    const index = orders.findIndex(order => order.id === Number(orderId));
    orders.splice(index, 1);
    res.sendStatus(204);
}

function list(req, res) {
    res.status(200).json({ data: orders });
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        hasOneOrMoreDish,
        quantityIsValidNumber,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        hasOneOrMoreDish,
        quantityIsValidNumber,
        orderIdMatches,
        statusPropertyIsValid,
        update
    ],
    delete: [
        orderExists,
        statusPropertyIsValid,
        destroy
    ],
    list,
}