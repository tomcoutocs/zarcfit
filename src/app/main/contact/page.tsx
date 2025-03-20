import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PhoneCall, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        
        <div className="mb-10">
          <p className="text-lg mb-6">
            Have a question about our programs or services? We&apos;re here to help. Reach out to us using the form below or contact us directly.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Your last name" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email address" />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="Your phone number" />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What is this regarding?" />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="How can we help you?" 
                      className="min-h-[150px]" 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
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
                Yes, you can pause your subscription for up to 3 months through your account settings or by contacting support.
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
  );
} 