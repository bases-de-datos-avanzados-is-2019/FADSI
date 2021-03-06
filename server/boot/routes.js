const neo4j = require('neo4j-driver').v1;
const Email = require('../email');

module.exports = function(app) {
    var router = app.loopback.Router();
    router.get('/neo/etl', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const resultPromise = session.run(
            "MATCH (n) DETACH DELETE n");  

        var User = app.models.User;
        var users = await User.find({where: {userType: 'client'}});

        const lengthUser = users.length;
        console.log(lengthUser);
        for (var i = 0; i < lengthUser; i++){
            const resultPromise = session.run(
                "CREATE (n:Client {userName: {username}, userID: {idNumber}}) RETURN n", {username: users[i].username, idNumber: users[i].id.toString()});              
        }

        var Site = app.models.site;
        var sites = await Site.find();
        
        const lengthSite = sites.length;
        console.log(lengthSite);
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
        console.log(lengthOrder);
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
        
        resultPromise.then(result => {
          session.close();
        driver.close();
        res.send({response: 'Successful ETL'});
        }); 

        
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

    router.get('/neo/topSites', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const result = session.run('MATCH (n:Site) RETURN n, size((n)<-[:REQUESTED]-()) AS count ORDER BY count DESC LIMIT 5');
        const collectedSites = [];
        
        result.subscribe({
          onNext: record => {
            const site = record.get(0);
            const count = record.get(1);
            var siteCount = {name: site.properties.name, siteID: site.properties.siteID, totalOrders: count.low};
            collectedSites.push(siteCount);
          },
          onCompleted: () => {
            session.close();

            driver.close();
            console.log(collectedSites);
            res.send({result: collectedSites});
          },
          onError: error => {
            console.log(error);
          }
        });
    });

    router.get('/neo/order/client/:id', async function(req, res) {

        const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
        const session = driver.session();

        const id = req.params.id;
        const result = session.run('MATCH (a:Client {userID: {userID}})-[:BUYS]->(oa)-[:REQUESTED]->(s)<-[:REQUESTED]-(ob)<-[:BUYS]-(b:Client) RETURN DISTINCT b, size((a)-[:BUYS]->()-[:REQUESTED]->()<-[:REQUESTED]-()<-[:BUYS]-(b)) AS count ORDER BY count DESC', { userID: id});
        const collectedClients = [];
        
        result.subscribe({
          onNext: record => {
            const client = record.get(0);
            const count = record.get(1);
            var clientCount = {userName: client.properties.userName, userID: client.properties.userID, totalMatches: count.low};
            collectedClients.push(clientCount);
          },
          onCompleted: () => {
            session.close();

            driver.close();
            res.send({result: collectedClients});
          },
          onError: error => {
            console.log(error);
          }
        });
    });

    router.get('/email/:id', async function(req,res) {
      const oEmail = new Email({
          service: "gmail",
          auth: {
              user: "equipolibrarytec@gmail.com",
              pass: "l1br4r1t3c"
          }
      });  
      const clientID = (req.params.id);
      var User = app.models.User;
      var user = await User.findById(clientID);
      console.log(user);
      const email = {
          from: "equipolibrarytec@gmail.com",
          to: user.email,
          subject: "Confirmación de ruta",
          html: `
              <div>
              <p>Se le informa que su ruta de interés se ha calculado exitosamente<p>
              <div>
          `
      };
      oEmail.sendEmail(email);
      res.json({mensaje: "Correo enviado"});
  
  });

  router.get('/neo/path/client/:clientID/site/:siteID', async function(req, res) {
    var Route = app.models.route;
    const clientID = req.params.clientID;
    const siteID = req.params.siteID;
    var routes = await Route.find({where: {idCliente: {like: clientID}, idMainSite: {like: siteID}}});
    var result = {};
  
    var collectedSegments = [];
    var subNodes = routes[0].possibleSites;
    const subLength = subNodes.length;
    var segment = {start: siteID, end: subNodes[0].idSubSite, cost: Math.abs(Number(subNodes[0].distance) - Number(subNodes[subLength-1].distance))};
    collectedSegments.push(segment);
    for(var j = 1; j < subLength; j++) {
      var segment = {start: subNodes[j-1].idSubSite, end: subNodes[j].idSubSite, cost: Math.abs(Number(subNodes[j-1].distance) - Number(subNodes[j].distance))};
      collectedSegments.push(segment);
    }
    result = {path: collectedSegments};
    res.send(result);
  });

    app.use(router);
  }
  