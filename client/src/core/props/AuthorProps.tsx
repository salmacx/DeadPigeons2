import type {Author} from "@core/generated-client.ts";

export interface AuthorProps {
    author: Author
    setAllAuthors: React.Dispatch<React.SetStateAction<Author[]>>
}