import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder
} from 'discord.js';

export type TextInputOptions = {
    style? : TextInputStyle,
    placeholder? : string,
    required? : boolean,
    maxLength? : number,
    minLength? : number
}

export function buildTextInput(
    customId : string,
    label : string,
    options : TextInputOptions = {}

) : LabelBuilder{
    const input = new TextInputBuilder()
    .setCustomId(customId)
    .setStyle(options.style ?? TextInputStyle.Short)
    .setRequired(options.required ?? true)
    .setValue('');

    if(options.placeholder) input.setPlaceholder(options.placeholder);
    if(options.maxLength) input.setMaxLength(options.maxLength);
    if(options.minLength) input.setMinLength(options.minLength);

    return new LabelBuilder()
    .setLabel(label)
    .setTextInputComponent(input);

}

export function buildModal(
    customId : string,
    title : string,
    fields : LabelBuilder[]
) : ModalBuilder {
    const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);


    modal.addLabelComponents(...fields);

    return modal;
}