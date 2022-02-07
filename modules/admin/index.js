const mongoose = require('mongoose')
const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const AdminJSMongoose = require('@adminjs/mongoose')
const bcrypt = require('bcrypt')

module.exports = (tracker) => {
    mongoose.Promise = global.Promise;mongoose.connect("mongodb://localhost:27017/donation-tracker");
    let User = mongoose.model('User', { id: String, username: String, password: String, lastLogin: Date, isSuperuser: Boolean, isStaff: Boolean, isVolunteer: Boolean,  firstName: String, lastName: String, email: String, dateCreated: Date })
    // const adminJs = new AdminJS({
    //     databases: [],
    //     resources: [User],
    //     rootPath: '/admin',
    //   })
      
    //   const router = AdminJSExpress.buildRouter(adminJs)
    //   tracker.app.use(adminJs.options.rootPath, router)
    //   AdminJS.registerAdapter(AdminJSMongoose)

      addUser()

    function addUser(options) {
        let user1 = new User({ id: '123', username: 'nicnacnic', password: 'test', lastLogin: new Date(), isSuperuser: true, isStaff: true, isVolunteer: false, firstName: 'Nicolas', lastName: 'Baror', email: 'nicnacnic@nicnacnic.com', dateCreated: new Date()});
        user1.save()
        //console.log('Created user ' + options.username)
    }
}