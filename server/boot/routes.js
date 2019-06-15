const neo4j = require('neo4j-driver').v1;

module.exports = function(app) {
    var router = app.loopback.Router();
    router.get('/ping', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const resultPromise = session.run(
            "MATCH (n) DETACH DELETE n");             

        var User = app.models.User;
        var users = await User.find({where: {userType: 'client'}});

        const lengthUser = users.length;
        for (var i = 0; i < lengthUser; i++){
            const resultPromise = session.run(
                "CREATE (n:Client {userName: {username}, userID: {idNumber}}) RETURN n", {username: users[i].username, idNumber: users[i].id.toString()});              
        }

        var Site = app.models.site;
        var sites = await Site.find();
        
        const lengthSite = sites.length;
        for (var i = 0; i < lengthSite; i++){
            const resultPromise = session.run(
                "CREATE (n:Site {name: {name}, siteID: {idSite}}) RETURN n", {name: sites[i].name, idSite: sites[i].id.toString()});      
            
            var products = sites[i].products;
            const lengthProd = products.length;
            for(var j = 0; j < lengthProd; j++) {
                const resultPromise = session.run(
                    "MATCH (a:Site {name: {siteName}}) CREATE (n:Product {name: {name}, description: {description}}) CREATE(a)-[s:SELLS {Cost: {price}}]->(n) RETURN s", {siteName: sites[i].name, name: products[j].name, description: products[j].description, price: products[j].price});
            }
        }

        var Order = app.models.order;
        var orders = await Order.find();

        const lengthOrder = orders.length;
        for (var i = 0; i < lengthOrder; i++){
            console.log(orders[i].idCliente);
            console.log(typeof orders[i].idCliente);
            const resultPromise = session.run(
                "MATCH (a:Client {userID: {idcliente}}) CREATE (n:Order {orderID: {orderID}, totalSum: {totalSum}}) CREATE(a)-[s:BUYS]->(n) RETURN s", {idcliente: orders[i].idCliente, orderID: orders[i].id.toString(), totalSum: orders[i].totalSum});   
            
            var orderSites = orders[i].idSitios;
            const lengthSit = orderSites.length;
            for(var j = 0; j < lengthSit; j++) {
                const resultPromise = session.run(
                    "MATCH (a:Order {orderID: {orderID}}),(b:Site {siteID: {siteID}}) CREATE(a)-[ab:REQUESTED]->(b) RETURN ab", {orderID: orders[i].id.toString(), siteID: orderSites[j]});
            }          
        }
        
        session.close();
        driver.close();
        res.send({response: 'Successful ETL'});
    });

    router.get('/neo/order/:id', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const id = req.params.id;
        const result = session.run('MATCH (a:Client {userID: {userID}})-[:BUYS]->(order:Order) RETURN order', { userID: id});
        const collectedNOrders = [];
        
        result.subscribe({
          onNext: record => {
            const order = record.get(0);
            collectedNOrders.push(order.properties);
          },
          onCompleted: () => {
            session.close();

            driver.close();
            res.send({result: collectedNOrders});
          },
          onError: error => {
            console.log(error);
          }
        });
    });

    router.get('/neo/order/site/:id', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const id = req.params.id;
        const result = session.run('MATCH (a:Client {userID: {userID}})-[:BUYS]->(o)-[:REQUESTED]->(site:Site) RETURN site', { userID: id});
        const collectedNOrders = [];
        
        result.subscribe({
          onNext: record => {
            const order = record.get(0);
            collectedNOrders.push(order.properties);
          },
          onCompleted: () => {
            session.close();

            driver.close();
            res.send({result: collectedNOrders});
          },
          onError: error => {
            console.log(error);
          }
        });
    });

    app.use(router);
  }
  