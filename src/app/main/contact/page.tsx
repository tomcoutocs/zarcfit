'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PhoneCall, Mail, MapPin, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHero from '@/components/layout/PageHero';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const { error } = await supabase.from('contact_messages').insert([{
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      subject: formData.subject || null,
      message: formData.message,
    }]);

    if (error) {
      setStatus('error');
      setErrorMessage('Something went wrong sending your message. Please try again or email us directly.');
      return;
    }

    setStatus('success');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <>
      <PageHero
        badge="Get In Touch"
        title="Contact Us"
        subtitle="Have a question? We're here to help you on your fitness journey"
        size="compact"
      />
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

                {status === 'success' ? (
                  <Alert className="border-green-500/50 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Thanks for reaching out! We&apos;ve received your message and will get back to you within 24 hours.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {status === 'error' && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="Your first name"
                          value={formData.firstName}
                          onChange={handleChange('firstName')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Your last name"
                          value={formData.lastName}
                          onChange={handleChange('lastName')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email address"
                        value={formData.email}
                        onChange={handleChange('email')}
                        required
                      />
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Your phone number"
                        value={formData.phone}
                        onChange={handleChange('phone')}
                      />
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What is this regarding?"
                        value={formData.subject}
                        onChange={handleChange('subject')}
                      />
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        className="min-h-[150px]"
                        value={formData.message}
                        onChange={handleChange('message')}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                      {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Information */}
          <div>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <PhoneCall className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p className="text-muted-foreground">(555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-muted-foreground">info@zarcfit.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Address</h3>
                      <p className="text-muted-foreground">
                        123 Fitness Street<br />
                        New York, NY 10001<br />
                        United States
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Hours</h3>
                      <p className="text-muted-foreground">
                        Monday - Friday: 9AM - 7PM<br />
                        Saturday: 10AM - 4PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Book a Consultation</h2>
                <p className="text-muted-foreground mb-4">
                  Schedule a free 15-minute consultation with one of our fitness experts to discuss your goals.
                </p>
                <Button className="w-full">
                  <span>Schedule Call</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Map Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Find Us</h2>
          <div className="bg-muted h-[400px] rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              [Interactive Map Would Be Displayed Here]
            </p>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="bg-primary/10 p-8 rounded-lg">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="max-w-2xl mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Reach out to our customer support team.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-lg mb-2">What are your response times?</h3>
              <p className="text-muted-foreground">
                We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 14-day money-back guarantee on all our programs if you&apos;re not satisfied with your purchase.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">How do I update my membership?</h3>
              <p className="text-muted-foreground">
                You can update your membership details through your account dashboard or by contacting our support team.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">Can I pause my subscription?</h3>
              <p className="text-muted-foreground">
                Self-serve pause and cancel options will be available when online billing launches. Contact support if you need help in the meantime.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <a href="/main/faq">View All FAQs</a>
            </Button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
} 