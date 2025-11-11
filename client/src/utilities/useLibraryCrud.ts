import toast from "react-hot-toast";
import type {Dispatch, SetStateAction} from "react";
import {resolveRefs} from "dotnet-json-refs";
import {
    type Author,
    type Book,
    type CreateAuthorRequestDto,
    type CreateBookRequestDto,
    type CreateGenreDto,
    type Genre,
    type UpdateAuthorRequestDto,
    type UpdateBookRequestDto,
    type UpdateGenreRequestDto
} from "@core/generated-client.ts";
import type {SieveModel} from "ts-sieve-query-builder";
import {libraryApi} from "@utilities/libraryApi.ts";



export default function useLibraryCrud() {

    async function updateAuthors(
        dto: UpdateAuthorRequestDto,
        setAuthors: Dispatch<SetStateAction<Author[]>>,
    ) {
      
            const result = (await libraryApi.updateAuthor(dto));
            setAuthors(prevAuthors => {
                const authors = prevAuthors || [];
                const index = authors.findIndex(a => a.id === result.id);
                if (index > -1) {
                    const duplicate = [...authors];
                    duplicate[index] = result;
                    return duplicate;
                }
                return authors;
            });

            toast.success("Author updated successfully");
            return result;
     
    }

    async function updateBooks(
        dto: UpdateBookRequestDto,
        setBooks: Dispatch<SetStateAction<Book[]>>,
    ) {
      
            const result = (await libraryApi.updateBook(dto));
            setBooks(prevBooks => {
                const books = prevBooks || [];
                const index = books.findIndex(b => b.id === result.id);
                if (index > -1) {
                    const duplicate = [...books];
                    duplicate[index] = result;
                    return duplicate;
                }
                return books;
            });


            toast.success("Book updated successfully");
            return result;
      
    }

    async function updateGenres(
        dto: UpdateGenreRequestDto,
        setGenres: Dispatch<SetStateAction<Genre[]>>
    ) {
       
            const result = resolveRefs(await libraryApi.updateGenre(dto));
            setGenres(prevGenres => {
                const genres = prevGenres || [];
                const index = genres.findIndex(g => g.id === result.id);
                if (index > -1) {
                    const duplicate = [...genres];
                    duplicate[index] = result;
                    return duplicate;
                }
                return genres;
            });
            toast.success("Genre updated successfully");
            return result;
      
    }

    async function deleteAuthor(
        id: string,
        setAuthors: Dispatch<SetStateAction<Author[]>>
    ) {
            const result = (await libraryApi.deleteAuthor(id));
            setAuthors(prevAuthors => (prevAuthors || []).filter(a => a.id !== id));
            toast.success("Author deleted successfully successfully");
            return result;
        
    }

    async function deleteBook(
        id: string,
        setBooks: Dispatch<SetStateAction<Book[]>>
    ) {
     
            const result = (await libraryApi.deleteBook(id));
            setBooks(prevBooks => (prevBooks || []).filter(b => b.id !== id));
            toast.success("Book deleted successfully");
            return result;
       
    }

    async function deleteGenre(
        id: string,
        setGenres: Dispatch<SetStateAction<Genre[]>>
    ) {
     
            const result = (await libraryApi.deleteGenre(id));
            setGenres(prevGenres => (prevGenres || []).filter(g => g.id !== id));
            toast.success("Genre deleted successfully");
            return result;
      
    }

    async function createAuthor(
        dto: CreateAuthorRequestDto,
        setAuthors: Dispatch<SetStateAction<Author[]>>
    ) {
            const result = (await libraryApi.createAuthor(dto));
            setAuthors(prevAuthors => [...(prevAuthors || []), result]);
            toast.success("Author created successfully");
            return result;
        
    }

    async function createBook(
        dto: CreateBookRequestDto,
        setBooks: Dispatch<SetStateAction<Book[]>>
    ) {
            const result = (await libraryApi.createBook(dto))
            setBooks(prevBooks => [...(prevBooks || []), result]);
            toast.success("Book created successfully");
            return result;
      
    }

    async function createGenre(
        dto: CreateGenreDto,
        setGenres: Dispatch<SetStateAction<Genre[]>>
    ) {
        
            const result = (await libraryApi.createGenre(dto));
            setGenres(prevGenres => [...(prevGenres || []), result]);
            toast.success("Genre created successfully");
            return result;
       
    }

    async function getAuthors(setAuthors: Dispatch<SetStateAction<Author[]>>, sieveModel: SieveModel) {
            const result = (await libraryApi.getAuthors((sieveModel)));
            setAuthors(Array.isArray(result) ? result : []);
       
    }

    async function getBooks(setBooks: Dispatch<SetStateAction<Book[]>>, sieveModel: SieveModel) {
            const result = (await libraryApi.getBooks((sieveModel)));
            setBooks(Array.isArray(result) ? result : []);
       
    }

    async function getGenres(setGenres: Dispatch<SetStateAction<Genre[]>>, sieveModel: SieveModel) {
 
            const result = (await libraryApi.getGenres((sieveModel)));
            setGenres(Array.isArray(result) ? result : []);
     
    }


    return {
        updateAuthors,
        updateBooks,
        updateGenres,
        deleteAuthor,
        deleteBook,
        deleteGenre,
        createAuthor,
        createBook,
        createGenre,
        getAuthors,
        getBooks,
        getGenres
    }

}