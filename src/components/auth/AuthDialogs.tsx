
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "./LoginForm"
import { SignUpForm } from "./SignUpForm"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"

export function AuthDialogs() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const handleLoginClick = () => {
    if (isMobile) {
      navigate("/login")
    } else {
      setLoginOpen(true)
    }
  }

  const handleSignUpClick = () => {
    if (isMobile) {
      navigate("/signup")
    } else {
      setSignUpOpen(true)
    }
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLoginClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Log in
        </button>
        <button
          onClick={handleSignUpClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
        >
          Sign up
        </button>
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={signUpOpen} onOpenChange={setSignUpOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create an account</DialogTitle>
            <DialogDescription>
              Enter your information to create a new account
            </DialogDescription>
          </DialogHeader>
          <SignUpForm onSuccess={() => setSignUpOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
