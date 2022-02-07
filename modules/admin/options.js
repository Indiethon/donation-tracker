const AdminJS = require('adminjs')
let tracker;

// Admin.JS options.
module.exports = (tracker) => {
    return {
        databases: [],
        resources: [{
            resource: tracker.database.User,
            options: {
                properties: {
                    password: {
                        isVisible: {
                            edit: false,
                            show: true,
                            list: true,
                            filter: true
                        }
                    },
                    lastLogin: {
                        isDisabled: true,
                    },
                    dateCreated: {
                        isDisabled: true,
                    },
                    username: {
                        isTitle: true,
                    },
                    email: {
                        position: 100,
                    }
                },
                actions: {
                    new: {
                        before: async (request) => {
                            console.log(request.payload);
                            request.payload.password = await bcrypt.hash('password', 10)
                            console.log(request.payload)
                            return request
                        },
                    },
                    edit: {
                        isAccessible: ({ currentAdmin, password }) => currentAdmin && currentAdmin.isSuperuser
                    }
                }
            }
        }, tracker.database.Event],
        branding: {
            companyName: tracker.config.tracker.name,
            softwareBrothers: false,
            logo: tracker.config.tracker.logoURL,
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
        rootPath: '/admin'
    }
}