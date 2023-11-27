import * as Icons from "../components/Icons.tsx";
export interface Project {
  image: string;
  title: string;
  link: string;
  github?: string;
}

interface ProjectProps {
  items: Project[];
  class?: string;
}

export default function Projects(props: ProjectProps) {
  return (
    <div
      class={`pt-8 grid grid-cols-1 sm:grid-cols-3 items-center ${
        props.class ?? ""
      }`}
    >
      {props.items.filter((item) => item.link.length > 0).map((project) => (
        <div class="w-full max-w-sm mx-auto group">
          <a href={project.link} tabIndex={-1}>
            <img
              loading="lazy"
              src={`/showcase/${project.image}1x.jpg`}
              srcset={`/showcase/${project.image}2x.jpg 2x, /showcase/${project.image}1x.jpg 1x`}
              alt={project.title}
              width={600}
              height={337}
              style={{ aspectRatio: "16/9" }}
              class="object-cover shadow-lg group-hover:shadow-xl group-hover:opacity-70 rounded-lg"
            />
          </a>
          <div class="mt-4 flex items-center">
            <div class="text-lg text-gray-600 flex-1 group-hover:text-underline">
              <a href={project.link}>{project.title}</a>
            </div>
            {project.github && (
              <a
                href={`https://github.com/${project.github}`}
                class="ml-2 text-gray-500 hover:text-gray-700"
              >
                <span class="sr-only">GitHub</span>
                <Icons.GitHub class="inline float-right h-6 w-6" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
