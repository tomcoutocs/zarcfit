import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, Phone, Video, Info, Paperclip } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Messages</h2>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            <div className="p-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-2 py-2">Your Coaches</h3>
              
              {/* Active Conversation */}
              <div className="px-2 py-3 rounded-lg bg-accent/50 mb-1">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                    <AvatarFallback>JZ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">John Zarco</p>
                      <span className="text-xs text-muted-foreground">9:41 AM</span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">Perfect! Let me know how the new workout plan goes.</p>
                  </div>
                </div>
              </div>
              
              {/* Other Conversations */}
              <div className="px-2 py-3 rounded-lg hover:bg-accent/30 transition-colors mb-1">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src="/assets/images/coach-sarah.jpg" alt="Sarah Miller" />
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Sarah Miller</p>
                      <span className="text-xs text-muted-foreground">Yesterday</span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">Your nutrition plan is ready! Check it out when you can.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-2 py-3 rounded-lg hover:bg-accent/30 transition-colors mb-1">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src="/assets/images/coach-mike.jpg" alt="Mike Johnson" />
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Mike Johnson</p>
                      <span className="text-xs text-muted-foreground">Tuesday</span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">How was your recovery day? Ready for leg day tomorrow?</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-muted-foreground px-2 py-2 mt-4">Support</h3>
              
              <div className="px-2 py-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src="/assets/images/support.jpg" alt="Support Team" />
                    <AvatarFallback>ST</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Support Team</p>
                      <span className="text-xs text-muted-foreground">Monday</span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">Thanks for contacting us! Let us know if you need anything else.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background/50">
          {/* Chat Header */}
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                <AvatarFallback>JZ</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">John Zarco</p>
                <p className="text-xs text-muted-foreground">Head Coach • Online</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" title="Phone Call">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Video Call">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Info">
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex flex-col space-y-1.5 max-w-[75%]">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                  <AvatarFallback>JZ</AvatarFallback>
                </Avatar>
                <div className="bg-accent p-3 rounded-lg rounded-bl-none">
                  <p>Good morning! How are you feeling after yesterday&apos;s workout?</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-10">9:30 AM</span>
            </div>
            
            <div className="flex flex-col space-y-1.5 items-end ml-auto max-w-[75%]">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none">
                <p>Hey John! I&apos;m feeling pretty good. Some soreness in my quads, but nothing too bad.</p>
              </div>
              <span className="text-xs text-muted-foreground">9:35 AM</span>
            </div>
            
            <div className="flex flex-col space-y-1.5 max-w-[75%]">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                  <AvatarFallback>JZ</AvatarFallback>
                </Avatar>
                <div className="bg-accent p-3 rounded-lg rounded-bl-none">
                  <p>Great to hear! That&apos;s normal after increasing the squat weight. Make sure you&apos;re getting enough protein for recovery.</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-10">9:37 AM</span>
            </div>
            
            <div className="flex flex-col space-y-1.5 max-w-[75%]">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                  <AvatarFallback>JZ</AvatarFallback>
                </Avatar>
                <div className="bg-accent p-3 rounded-lg rounded-bl-none">
                  <p>I&apos;ve prepared a new workout plan for next week that focuses more on compound movements. Would you like me to send it over?</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-10">9:38 AM</span>
            </div>
            
            <div className="flex flex-col space-y-1.5 items-end ml-auto max-w-[75%]">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none">
                <p>Yes, absolutely! I&apos;ve been enjoying the compound lifts and would love to see what you&apos;ve got planned.</p>
              </div>
              <span className="text-xs text-muted-foreground">9:40 AM</span>
            </div>
            
            <div className="flex flex-col space-y-1.5 max-w-[75%]">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/assets/images/coach-john.jpg" alt="John Zarco" />
                  <AvatarFallback>JZ</AvatarFallback>
                </Avatar>
                <div className="bg-accent p-3 rounded-lg rounded-bl-none">
                  <p>Perfect! Let me know how the new workout plan goes.</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-10">9:41 AM</span>
            </div>
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" title="Attach File">
                <Paperclip className="h-5 w-5" />
              </Button>
              <div className="flex-1 bg-background border rounded-lg overflow-hidden">
                <Input 
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                  placeholder="Type your message..." 
                />
              </div>
              <Button className="rounded-full h-10 w-10 p-0" title="Send Message">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 