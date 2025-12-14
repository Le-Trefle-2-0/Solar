import {auth} from "./auth"

const openAPISchema = await auth.api.generateOpenAPISchema()
console.log(openAPISchema)