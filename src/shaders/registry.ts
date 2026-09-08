import { defaults as sketchDefaults } from './storyboard/model';
import { renderSketch } from './storyboard/render';
import { defaults as toonDefaults } from './toon/model';
import { renderToon } from './toon/render';
import { defaults } from './ascii/model';
import { renderAscii } from './ascii/render';
export const shaders = [{ id: 'ascii', name: 'ASCII', category: 'Character studies', description: 'Every pixel, a different character.', defaults, render: renderAscii }, { id: 'toon', name: 'Painterly Toon', category: 'Paint & ink', description: 'Brushwork meets bold outlines.', defaults: toonDefaults, render: renderToon }, {id:'storyboard',name:'Storyboard Sketch',category:'Pencil & value',description:'A scene, reduced to its essentials.',defaults:sketchDefaults,render:renderSketch}] as const;
