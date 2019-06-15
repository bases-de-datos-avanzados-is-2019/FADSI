const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
const session = driver.session();

const resultPromise = session.run("MATCH (n) DETACH DELETE n");

session.close();
driver.close();


const neo4j = require('neo4j-driver').v1;
const driver = neo4j.driver("bolt://35.243.138.141:7687", neo4j.auth.basic("neo4j", "2016122270"));
const session = driver.session();
const resultPromise = session.run(
  // "MATCH (a:Client {userID: {clienteId}}) CREATE (n:MainNode {nodeID: {mainID}}) CREATE(a)-[s:PATH_START]->(n) RETURN s", {clientId: clientID, mainID: siteID});   
  "CREATE (n:MainNode {nodeID: {mainID}}) RETURN n", {clientId: '123456', mainID: '123465'}); 
  session.close();
  driver.close();



console.log('Names: ' + collectedNames.join(', '));

const resultPromise = session.writeTransaction(tx => tx.run(
  'CREATE (a:Greeting) SET a.message = $message RETURN a.message + ", from node " + id(a)',
  {message: 'hello, world'}));

resultPromise.then(result => {
  session.close();

  const singleRecord = result.records[0];
  const greeting = singleRecord.get(0);

  console.log(greeting);

  // on application exit:
  driver.close();
});