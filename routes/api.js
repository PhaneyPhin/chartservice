
var express = require('express');
var router = express.Router();
const mssql = require('mssql')
var fs=require('fs');
const config = {
  user: 'sa',
  password: 'P@ssw0rd',
  server: '103.13.29.33',
  database: 'DTCGPS_EVO'
};

mssql.connect(config, function (err) {
  if(err) throw err;
  console.log("connected");
});


/* GET api listing. */
router.post('/getBlackbox_data', function (req, res, next) {
  //res.send('respond with a resource');
  console.log(req.body);
  var { blackbox_id, start_date, end_date } = req.body;
  start_date=new Date(parseInt(start_date)*1000).toISOString().replace('T',' ').substring(0,19);
  end_date=new Date(parseInt(end_date)*1000).toISOString().replace('T',' ').substring(0,19);
  
  var sql = `
    select s.R_TIME,s.TEMPERATURE_COL,(
      case when s.TEMPERATURE_COL='R_ANALOG1' then s.R_ANALOG1 else s.R_ANALOG2
      end) as R_ANALOG,s.TRUCK_NAME,s.TEMPERATURE_COL,s.TRUCK_LICENSE from (select R_TIME,
      (case when R_ANALOG1<1000 then R_ANALOG1 - (127) else (R_ANALOG1-12700)/100 end) AS R_ANALOG1,
      (case when R_ANALOG2<1000 then R_ANALOG2 - (127) else (R_ANALOG2-12700)/100 end) AS R_ANALOG2,TRUCK.TRUCK_NAME,TRUCK.TRUCK_LICENSE,
      CASE WHEN TRUCK.TEMPERATURE_COL IS NULL THEN 'R_ANALOG1' ELSE TRUCK.TEMPERATURE_COL END AS TEMPERATURE_COL from z${blackbox_id}Data 
      left join BLACKBOX on BLACKBOX.BLACKBOX_ID = '${blackbox_id}'
      left join TRUCK on BLACKBOX.TRUCK_ID = TRUCK.TRUCK_ID) as s
      where R_TIME >= '${start_date}' AND R_TIME <= '${end_date}' ORDER BY R_TIME ASC
  `;
  var request=new mssql.Request();
	fs.writeFile('test.txt',sql,err=>{});
  request.query(sql,(err,record)=>{
    if(err){
		 res.send({TRUCK_NAME:"",TRUCK_LICENSE:"",TEMPERATURE_COL:"",data:[]});
	}else{

      var result=record.recordsets[0].map(item=>[new Date(item.R_TIME).getTime(),item.R_ANALOG])
      console.log(result);
   	 if(result.length>0){
      res.send({TRUCK_NAME:record.recordsets[0][0].TRUCK_NAME,TEMPERATURE_COL:record.recordsets[0][0].TEMPERATURE_COL[0],TRUCK_LICENSE:record.recordsets[0][0].TRUCK_LICENSE,data:result});
      }else{
        res.send({TRUCK_NAME:"",TRUCK_LICENSE:"",TEMPERATURE_COL:"",data:[]});
      }
	}
  })
});
router.get('/chart', (req, res) => {
  res.render("chart", req.query);
})

router.get("/sl_tracking",(req,res)=>{
  var sql=`
  SELECT b.BLACKBOX_ID,r.R_TIME,m.TRUCK_NAME, m.STATION_NAME, m.Station_Type, m.PLAN_TIMEIN, m.ACTUAL_TIMEIN, m.Tracking, m.Result, m.Temp_IN, m.Temp_OUT, m.Distance, m.ETA, m.Temp_Alert, m.STATION_NOW, m.TAMBOL, m.AMPHUR, m.PROVINCE FROM      dbo.VW_Trip_Monitor_Abb m
  inner join TRUCK t on t.TRUCK_NAME=m.TRUCK_NAME inner join BLACKBOX b on t.TRUCK_ID=b.TRUCK_ID inner join REC_NOW r on r.BLACKBOX_ID=b.BLACKBOX_ID
  WHERE (DATEPART(dd, PLAN_TIMEIN) = DATEPART(dd, GETDATE())) AND (DATEPART(mm, PLAN_TIMEIN) = DATEPART(mm, GETDATE()))
  `
  var request=new mssql.Request();
  request.query(sql,(err,record)=>{
    if(err){
      res.send([]);
	}else{

      var result=record.recordsets[0];
      result = JSON.parse(JSON.stringify(result).replace(/\:null/gi, "\:\"\""));
      
      result=result.map((item)=>{
        item.PLAN_TIMEIN=formate(item.PLAN_TIMEIN);
        item.ACTUAL_TIMEIN=formate(item.ACTUAL_TIMEIN);
        item.ETA=formate(item.ETA);
        item.R_TIME=formate(item.R_TIME);
        return item;
      })
      res.send(result);
	}
  })
})
function formate(date){
 
  if(date!=""){
    date=new Date(date);
    return addZero(date.getDate())+"/"+addZero(date.getMonth()+1)+"/"+date.getFullYear()+" "+addZero(date.getHours())+":"+addZero(date.getMinutes())+":"+addZero(date.getSeconds());
  }
 return "";

}
function addZero(num){
  return num<10?"0"+num:num;
}
module.exports = router;