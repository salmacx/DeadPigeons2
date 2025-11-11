import {useState} from "react";
import {type LoginRequestDto, type RegisterRequestDto} from "@core/generated-client.ts";
import {authApi} from "@utilities/authApi.ts";

export default function Auth() {
    
    const [registerForm, setRegisterForm] = useState<RegisterRequestDto>({
        email: '',
        password: ''
    })

    const [loginForm, setLoginForm] = useState<LoginRequestDto>({
        email: '',
        password: ''
    })


    return <>
    
        <input placeholder="login email" onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
        <input placeholder="login pass" onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
        <input placeholder="register email" onChange={e => setRegisterForm({...registerForm, email: e.target.value})} />
        <input placeholder="register pass" onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
    
        <button onClick={() => {
            authApi.login(loginForm).
                then(r => {
                localStorage.setItem('jwt', r.token)
                console.log(r)
            })
        }}>login</button>

        <button onClick={() => {
            authApi.register(registerForm).
            then(r => {
                localStorage.setItem('jwt', r.token)
                console.log(r)
            })
        }}>register</button>
    </>
}