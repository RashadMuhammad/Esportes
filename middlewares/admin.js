const islogin = (req,res,next) => {
    try {
        if(req.session.admin_id){
            next()
        }
        else{
            res.redirect('/admin/adminlogin')
        }
        
    } catch (error) {
        
        
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
                
    }
}

module.exports = {
    islogin,
    islogout
}