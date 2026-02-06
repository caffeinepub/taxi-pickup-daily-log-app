import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t bg-card mt-auto">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="text-center text-sm text-muted-foreground">
                    © 2025. Built with{' '}
                    <Heart className="inline h-4 w-4 text-destructive fill-destructive" /> using{' '}
                    <a
                        href="https://caffeine.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                        caffeine.ai
                    </a>
                </div>
            </div>
        </footer>
    );
}

