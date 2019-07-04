var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect("/sl_tracking");
});
router.get("/sl_tracking",(req,res,next)=>{
  res.render('sl_tracking');
})
module.exports = router;
