const handle500Error = (err, req, res, next) => {
    console.error(err.stack); 
    res.status(500).render("500", { error: "Internal Server Error" }); 
  };
  
  const handle404Error = (req, res, next) => {
    res.status(404).render("404"); 
  };
  
  module.exports = {
    handle500Error,
    handle404Error
  };