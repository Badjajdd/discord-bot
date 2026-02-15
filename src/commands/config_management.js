const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('إدارة إعدادات البوت (config.json)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('view')
            .setDescription('عرض الإعدادات الحالية'))
        .addSubcommand(sub => sub
            .setName('set_role')
            .setDescription('تعيين معرف رتبة')
            .addStringOption(opt => opt.setName('type').setDescription('نوع الرتبة').setRequired(true)
                .addChoices(
                    { name: 'Admin Role', value: 'adminRoleId' }
                ))
            .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('set_channel')
            .setDescription('تعيين معرف قناة')
            .addStringOption(opt => opt.setName('type').setDescription('نوع القناة').setRequired(true)
                .addChoices(
                    { name: 'Ticket Category', value: 'ticketCategoryId' },
                    { name: 'Log Channel', value: 'logChannelId' },
                    { name: 'Stats Channel', value: 'statsChannelId' },
                    { name: 'Admin Channel', value: 'adminChannelId' }
                ))
            .addChannelOption(opt => opt.setName('channel').setDescription('القناة').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('add_high_admin')
            .setDescription('إضافة رتبة إلى الإدارة العليا')
            .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('remove_high_admin')
            .setDescription('إزالة رتبة من الإدارة العليا')
            .addStringOption(opt => opt.setName('role_id').setDescription('معرف الرتبة').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('set_role_icon')
            .setDescription('تعيين أيقونة لرتبة معينة')
            .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
            .addStringOption(opt => opt.setName('icon').setDescription('الأيقونة (Emoji)').setRequired(true))),

    async execute(interaction) {
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ إعدادات البوت الحالية')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Admin Role', value: `<@&${config.adminRoleId}>`, inline: true },
                    { name: 'Ticket Category', value: `<#${config.ticketCategoryId}>`, inline: true },
                    { name: 'Log Channel', value: `<#${config.logChannelId}>`, inline: true },
                    { name: 'Stats Channel', value: `<#${config.statsChannelId}>`, inline: true },
                    { name: 'Admin Channel', value: `<#${config.adminChannelId}>`, inline: true },
                    { name: 'High Admin Roles', value: config.highAdminRoleIds.map(id => `<@&${id}>`).join(', ') || 'لا يوجد' }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (subcommand === 'set_role') {
            const type = interaction.options.getString('type');
            const role = interaction.options.getRole('role');
            config[type] = role.id;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return interaction.reply({ content: `✅ تم تعيين **${type}** إلى ${role}`, ephemeral: true });
        }

        if (subcommand === 'set_channel') {
            const type = interaction.options.getString('type');
            const channel = interaction.options.getChannel('channel');
            config[type] = channel.id;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return interaction.reply({ content: `✅ تم تعيين **${type}** إلى ${channel}`, ephemeral: true });
        }

        if (subcommand === 'add_high_admin') {
            const role = interaction.options.getRole('role');
            if (!config.highAdminRoleIds.includes(role.id)) {
                config.highAdminRoleIds.push(role.id);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                return interaction.reply({ content: `✅ تم إضافة ${role} إلى رتب الإدارة العليا.`, ephemeral: true });
            }
            return interaction.reply({ content: 'هذه الرتبة موجودة بالفعل.', ephemeral: true });
        }

        if (subcommand === 'remove_high_admin') {
            const roleId = interaction.options.getString('role_id');
            config.highAdminRoleIds = config.highAdminRoleIds.filter(id => id !== roleId);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return interaction.reply({ content: `✅ تم إزالة الرتبة ذات المعرف \`${roleId}\` من الإدارة العليا.`, ephemeral: true });
        }

        if (subcommand === 'set_role_icon') {
            const role = interaction.options.getRole('role');
            const icon = interaction.options.getString('icon');
            if (!config.roleIcons) config.roleIcons = {};
            config.roleIcons[role.id] = icon;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return interaction.reply({ content: `✅ تم تعيين الأيقونة ${icon} للرتبة ${role}`, ephemeral: true });
        }
    }
};
