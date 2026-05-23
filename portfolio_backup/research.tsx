import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';

const rdProjects = [
  {
    title: 'AI-Powered Code Review Assistant',
    description: 'Developed an internal tool that integrates with our CI/CD pipeline to automatically review code for quality, style, and potential bugs using a custom-trained LLM, reducing manual review time by 30%.',
    tech: ['LLM', 'Python', 'FastAPI', 'CI/CD', 'Docker'],
  },
  {
    title: 'IoT Predictive Maintenance PoC',
    description: 'Built a proof-of-concept for an industrial IoT solution that uses sensor data and machine learning to predict equipment failures before they happen, leveraging MQTT for data ingestion and a .NET backend for analysis.',
    tech: ['IoT', '.NET', 'MQTT', 'Machine Learning', 'Azure'],
  },
  {
    title: 'Advanced RAG for Documentation',
    description: 'Engineered a Retrieval-Augmented Generation system for internal documentation, enabling developers to ask natural language questions and receive precise answers with source links, significantly improving knowledge discovery.',
    tech: ['RAG', 'LangChain', 'Vector DB', 'Transformers'],
  },
];

export function Research() {
  return (
    <Section id="research" title="My R&D">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rdProjects.map((project) => (
          <Card
            key={project.title}
            variant="glass"
            className="flex flex-col transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                 <FlaskConical className="h-6 w-6 text-accent" />
                <CardTitle>{project.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </CardContent>
            <CardFooter>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Section>
  );
}
