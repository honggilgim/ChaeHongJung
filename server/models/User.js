const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name : {
        type : String,
        maxlength : 50
    },
    email : {
        type : String,
        trim : true,
        unique: 1
    },
    password : {
        type : String,
        minlength: 5
    },
    lastname : {
        type : String,
        maxlength: 50
    },
    role : {
        type : Number,
        default: 0
    },
    Image: String,
    token : {
        type : String
    },
    tokenExp : {
        type: Number
    }

})

userSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')) {
    // 비밀번호 암호화
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if(err) return next(err)
        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err)
            user.password = hash
            next()
        })
    })
    } else {
        next()
    }
})

userSchema.methods.comparePassword= function(plainPassword,cb){
    //평문 비밀번호와 데이터베이스에 있는 암호화된 비밀번호 같은지 체크
    //평문도 암호화 해서 비교해봐야한다
    bcrypt.compare(plainPassword,this.password,function(err,isMatch){
        if(err) return cb(err);
        cb(null,isMatch);
    })
}

userSchema.methods.generateToken= function(cb){
    var user=this;
    
    //jsonwebtoken을 이용해서 token 생성하기
    var token = jwt.sign(user._id.toHexString(),'secretToken');
    
    user.token=token;
    user.save(function(err,user){
        if(err)return cb(err)
        cb(null,user)
    })
}

userSchema.statics.findByToken = function(token, cb) {
    var user = this;
    
    //토큰을 디코드 한다.
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //유저 아이디를 이용해서 유저를 찾은 다음에
        //클라이언트에서 가져온 토큰과 디비에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err,user){
            if(err) return cb(err);
            cb(null,user)
        })
    })
}
const User = mongoose.model('User', userSchema)

module.exports = { User }
