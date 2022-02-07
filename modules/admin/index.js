const mongoose = require('mongoose')
const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const AdminJSMongoose = require('@adminjs/mongoose')
const bcrypt = require('bcrypt')
const schemas = require('./schemas')
const { v4: uuid } = require('uuid');
const path = require('path')
const express = require('express')

module.exports = (tracker) => {
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost:27017/donation-tracker");
    let User = mongoose.model('User', schemas.user)

    AdminJS.registerAdapter(AdminJSMongoose)

    const adminJs = new AdminJS({
        databases: [],
        resources: [{
            resource: User,
            options: {
                properties: {
                    password: {
                        isVisible: false,
                    },
                },
                actions: {
                    new: {
                        before: async (request) => {
                            if (request.payload.record.password) {
                                request.payload.record = {
                                    ...request.payload.record,
                                    password: await bcrypt.hash(request.payload.record.password, 10),
                                    password: undefined,
                                }
                            }
                            return request
                        },
                    }
                }
            }
        }],
        branding: {
            companyName: 'Test!',
            softwareBrothers: false,
            logo: 'https://www.w3.org/html/logo/downloads/HTML5_Logo_256.png',
        },
        locale: {
            translations: {
                messages: {
                    loginWelcome: 'Administration Panel - Login' // the smaller text
                },
                labels: {
                    loginWelcome: 'The Big Text', // this could be your project name
                },
            }
        },
        dashboard: {
            component: AdminJS.bundle('./test')
        },
        assets: {
            styles: ['/admin/custom/css.css'], // here you can hide the default images and re-position the boxes or text.
            scripts: ['/admin/custom/test.js'],
        },
        pages: {
            customPage: {
                label: "Custom page",
                handler: async (request, response, context) => {
                    return {
                        text: 'I am fetched from the backend',
                    }
                },
            },
            anotherPage: {
                label: "TypeScript page",
            },
        },
        rootPath: '/admin',
    })

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
        authenticate: async (username, password) => {
            const user = await User.findOne({ username })
            if (user) {
                const matched = await bcrypt.compare(password, user.password)
                if (matched) {
                    return user
                }
            }
            return false
        },
        cookiePassword: 'some-secret-password-used-to-secure-cookie',
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