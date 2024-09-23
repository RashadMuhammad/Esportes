const islogin = (req,res,next) => {
    try {
        if(req.session.admin_id){
            next()
        }
        else{
            res.redirect('/admin/adminlogin')
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const islogout = (req,res,next) => {
    
    try {
        if(req.session.admin_id){
            res.redirect('/admin/Dashboard')
        }else{
        next()
        }
    } catch (error) {
        console.log(error.message);        
    }
}

module.exports = {
    islogin,
    islogout
}