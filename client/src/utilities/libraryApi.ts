import {LibraryClient} from "@core/generated-client.ts";
import {finalUrl} from "@utilities/finalUrl.ts";
import {customFetch} from "@utilities/customFetch.ts";

export const libraryApi = new LibraryClient(finalUrl, customFetch);