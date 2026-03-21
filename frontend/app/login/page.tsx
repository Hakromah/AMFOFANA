'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AxiosError } from 'axios';

const formSchema = z.object({
   email: z.string().email({ message: 'Please enter a valid email.' }),
   password: z.string().min(1, { message: 'Password is required' }),
});

export default function LoginPage() {
   const router = useRouter();
   const [isLoading, setIsLoading] = useState(false);

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   });

   const onSubmit = async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      try {
         await api.post('/auth/local', { identifier: values.email, password: values.password }, { withCredentials: true });

         const role = getUserRole();
         if (!role) {
            throw new Error("Login succeeded, but no user role found in cookies.");
         }

         toast.success('Login Successful', {
            description: `Welcome! Redirecting to your dashboard...`,
         });

         setTimeout(() => {
            switch (role) {
               case 'ADMIN':
                  router.push('/admin');
                  break;
               case 'TEACHER':
                  router.push('/teacher');
                  break;
               case 'STUDENT':
                  router.push('/student');
                  break;
               default:
                  router.push('/');
            }
         }, 1000);

      } catch (error) {
         if (error instanceof AxiosError && (error.response?.status === 400 || error.response?.status === 401)) {
            // Handle "Bad credentials" specifically without logging the full error
            toast.error('Login Failed', {
               description: 'Invalid email or password. Please try again.',
            });
         } else {
            // Log other, unexpected errors
            console.error("Login failed:", error);
            toast.error('Login Failed', {
               description: 'An unexpected error occurred. Please try again later.',
            });
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
         <Card className="w-full max-w-md">
            <CardHeader>
               <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                 <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                 <Input type="password" placeholder="Your password" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                     <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                     </Button>
                  </form>
               </Form>
            </CardContent>
         </Card>
      </div>
   );
}
