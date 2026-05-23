import { Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function Hero() {
  return (
    <section id="home" className="text-center py-20 md:py-32">
      <div className="flex justify-center mb-8">
        <Image
          src="https://placehold.co/150x150.png"
          alt="Boda Madhukar Reddy"
          width={150}
          height={150}
          className="rounded-full object-cover"
          data-ai-hint="person portrait"
        />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline text-primary">
        BODA MADHUKAR REDDY
      </h1>
      <p className="mt-3 md:mt-4 text-lg md:text-xl text-accent font-semibold">
        SOFTWARE ARCHITECT
      </p>
      <p className="mt-4 mx-auto max-w-2xl text-muted-foreground">
        A seasoned architect delivering scalable, API-driven platforms with expertise in hybrid IoT, system modernization, and AI-powered automation.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild size="lg">
          <a href="mailto:madhukarreddyboda538@gmail.com">
            <Mail className="mr-2 h-5 w-5" />
            madhukarreddyboda538@gmail.com
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="tel:+919573153479">
            <Phone className="mr-2 h-5 w-5" />
            +91 9573153479
          </a>
        </Button>
      </div>
    </section>
  );
}
