type User = {
    name: string;
    email: string;
    password: string;
    };




declare module 'express' {
    interface Request {
      user: any; // or the type of your User model
    }
  }

export { User };