use clap::Parser;
use quide::cli;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<cli::Commands>,
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Some(cli::Commands::Run { file }) => {
            println!("Running circuit from file: {}", file);
            // In the future: quide::simulator::run(file);
        }
        None => {
            println!("Welcome to QuIDE (Rust Version)");
        }
    }
}
