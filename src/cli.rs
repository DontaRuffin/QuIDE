use clap::Subcommand;

#[derive(Subcommand)]
pub enum Commands {
    /// Run a quantum circuit file
    Run {
        #[arg(short, long)]
        file: String,
    },
}
