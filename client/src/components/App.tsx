import {createBrowserRouter, RouterProvider} from "react-router";
import Home from "@components/Home.tsx";
import {DevTools} from "jotai-devtools";
import 'jotai-devtools/styles.css'
import Books from "@components/routes/books/Books.tsx";
import Authors from "@components/routes/authors/Authors.tsx";
import Genres from "@components/routes/genres/Genres.tsx";
import {Toaster} from "react-hot-toast";
import Auth from "@components/routes/auth/Auth.tsx";

function App() {
    return (
        <>
            <RouterProvider router={createBrowserRouter([
                {
                    path: '',
                    element: <Home/>,
                    children: [
                        {
                            path: 'books',
                            element: <Books/>
                        },
                        {
                            path: 'authors',
                            element: <Authors/>
                        },
                        {
                            path: 'genres',
                            element: <Genres/>
                        },
                        {
                            path: 'auth',
                            element: <Auth />
                        }
                        
                    ]
                }
            ])}/>
            <DevTools/>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
        </>
    )
}

export default App
