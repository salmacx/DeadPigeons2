import {AuthClient} from "@core/generated-client.ts";
import {finalUrl} from "@utilities/finalUrl.ts";
import {customFetch} from "@utilities/customFetch.ts";


export const authApi = new AuthClient(finalUrl, customFetch);
