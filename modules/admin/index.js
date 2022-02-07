const mongoose = require('mongoose')
const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const AdminJSMongoose = require('@adminjs/mongoose')
const bcrypt = require('bcrypt')
const { v4: uuid } = require('uuid');
const path = require('path')
const express = require('express')
const options = require('./options')
let currentUser;

module.exports = (tracker) => {
    AdminJS.registerAdapter(AdminJSMongoose)

    const adminJs = new AdminJS(options(tracker))

    //   {
    //     resource: User,
    //     options: {
    //       properties: {
    //         password: {
    //           type: 'string',
    //           isVisible: {
    //             list: false, edit: true, filter: false, show: false,
    //           },
    //         },
    //       },
    //       actions: {
    //         new: {
    //           before: async (request) => {
    //             if(request.payload.password) {
    //               request.payload = {
    //                 ...request.payload,
    //                 password: await bcrypt.hash(request.payload.password, 10),
    //                 password: undefined,
    //               }
    //             }
    //             return request
    //           },
    //         }
    //       }
    //     }
    //   }


    const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
        authenticate: async (username, password, lastLogin) => {
            let user = await tracker.database.User.findOne({ username })
            if (user) {
                const matched = await bcrypt.compare(password, user.password)
                if (matched) {
                    console.info(`User ${username} has logged in.`)
                    user.lastLogin = Date.now();
                    user.save();
                    return user
                }
            }
            return false
        },
        cookiePassword: tracker.config.tracker.passwordHash,
    })

    tracker.app.use('/admin/custom', express.static(path.join(__dirname, './css')));
    tracker.app.use(adminJs.options.rootPath, router)

    //setTimeout(() => createUser({ username: 'test', password: 'test', isSuperuser: true, isStaff: true, isVolunteer: false, permissions: 124 }, 2000))

    function createUser(options = { username: '', password: '', isSuperuser: false, isStaff: false, isVolunteer: false, permissions: 000 }) {
        bcrypt.hash(options.password, 10, (err, hash) => {
            if (err) return;
            options.password = hash;
            options.dateCreated = new Date();
            new User(options).save()
        });
    }

    function removeUser(id) {
        User.deleteOne({ id: id }, (err) => {
            if (err) return false;
            console.log("Successful deletion");
        });
    }
}